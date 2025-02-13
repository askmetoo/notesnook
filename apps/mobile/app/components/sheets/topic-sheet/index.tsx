/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import qclone from "qclone";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { Animated, Dimensions, View, RefreshControl } from "react-native";
import ActionSheet, {
  ActionSheetRef,
  FlatList
} from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { IconButton } from "../../../components/ui/icon-button";
import { PressableButton } from "../../../components/ui/pressable";
import Paragraph from "../../../components/ui/typography/paragraph";
import { TopicNotes } from "../../../screens/notes/topic-notes";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import useNavigationStore, {
  NotebookScreenParams
} from "../../../stores/use-navigation-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import {
  eOnNewTopicAdded,
  eOnTopicSheetUpdate,
  eOpenAddTopicDialog
} from "../../../utils/events";
import { normalize, SIZE } from "../../../utils/size";
import { NotebookType, TopicType } from "../../../utils/types";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { openEditor } from "../../../screens/notes/common";
import { getTotalNotes, history } from "../../../utils";
import { Properties } from "../../properties";
import { deleteItems } from "../../../utils/functions";
import { presentDialog } from "../../dialog/functions";
import Config from "react-native-config";
import { notesnook } from "../../../../e2e/test.ids";

export const TopicsSheet = () => {
  const currentScreen = useNavigationStore((state) => state.currentScreen);
  const canShow =
    currentScreen.name === "Notebook" || currentScreen.name === "TopicNotes";
  const [notebook, setNotebook] = useState(
    canShow
      ? db.notebooks?.notebook(
          currentScreen?.notebookId || currentScreen?.id || ""
        )?.data
      : null
  );
  const [selection, setSelection] = useState<TopicType[]>([]);
  const [enabled, setEnabled] = useState(false);
  const colors = useThemeStore((state) => state.colors);
  const ref = useRef<ActionSheetRef>(null);
  const [topics, setTopics] = useState(notebook ? qclone(notebook.topics) : []);
  const [animations] = useState({
    translate: new Animated.Value(0),
    display: new Animated.Value(-5000),
    opacity: new Animated.Value(0)
  });
  const onRequestUpdate = React.useCallback(
    (data?: NotebookScreenParams) => {
      if (!canShow) return;
      if (!data) data = { item: notebook } as NotebookScreenParams;
      const _notebook = db.notebooks?.notebook(data.item?.id)
        ?.data as NotebookType;
      if (_notebook) {
        setNotebook(_notebook);
        setTopics(qclone(_notebook.topics));
      }
    },
    [notebook, canShow]
  );

  useEffect(() => {
    const onTopicUpdate = () => {
      onRequestUpdate();
    };
    eSubscribeEvent(eOnTopicSheetUpdate, onTopicUpdate);
    eSubscribeEvent(eOnNewTopicAdded, onRequestUpdate);
    return () => {
      eUnSubscribeEvent(eOnTopicSheetUpdate, onRequestUpdate);
      eUnSubscribeEvent(eOnNewTopicAdded, onTopicUpdate);
    };
  }, [onRequestUpdate]);

  const PLACEHOLDER_DATA = {
    heading: "Topics",
    paragraph: "You have not added any topics yet.",
    button: "Add first topic",
    action: () => {
      eSendEvent(eOpenAddTopicDialog, { notebookId: notebook.id });
    },
    loading: "Loading notebook topics"
  };

  const renderTopic = ({ item, index }: { item: TopicType; index: number }) => (
    <TopicItem item={item} index={index} />
  );

  const selectionContext = {
    selection: selection,
    enabled,
    setEnabled,
    toggleSelection: (item: TopicType) => {
      setSelection((state) => {
        const selection = [...state];
        const index = selection.findIndex(
          (selected) => selected.id === item.id
        );
        if (index > -1) {
          selection.splice(index, 1);
          if (selection.length === 0) {
            setEnabled(false);
          }
          return selection;
        }
        selection.push(item);
        return selection;
      });
    }
  };

  useEffect(() => {
    if (canShow) {
      const isTopic = currentScreen.name === "TopicNotes";
      const id = isTopic ? currentScreen?.notebookId : currentScreen?.id;
      if (!ref.current?.isOpen()) {
        animations.display.setValue(5000);
        animations.opacity.setValue(0);
      }
      if (id) {
        onRequestUpdate({
          item: db.notebooks?.notebook(id).data
        } as any);
      }
      ref.current?.show();
    } else {
      ref.current?.hide();
    }
  }, [
    animations.display,
    animations.opacity,
    canShow,
    currentScreen?.id,
    currentScreen.name,
    currentScreen?.notebookId,
    onRequestUpdate
  ]);

  return (
    <ActionSheet
      ref={ref}
      isModal={false}
      containerStyle={{
        maxHeight: 400,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        borderBottomWidth: 0
      }}
      closable={!canShow}
      elevation={10}
      indicatorStyle={{
        width: 100,
        backgroundColor: colors.nav
      }}
      keyboardHandlerEnabled={false}
      snapPoints={Config.isTesting === "true" ? [100] : [15, 100]}
      initialSnapIndex={0}
      backgroundInteractionEnabled
      onChange={(position, height) => {
        animations.translate.setValue(position - 60);
        const h = Dimensions.get("window").height;
        const minPos = h - height;
        if (position - 100 < minPos || !canShow) {
          animations.display.setValue(5000);
          animations.opacity.setValue(0);
        } else {
          animations.display.setValue(0);
          setTimeout(() => {
            animations.opacity.setValue(1);
          }, 300);
        }
      }}
      gestureEnabled
      ExtraOverlayComponent={
        <Animated.View
          style={{
            top: animations.translate,
            position: "absolute",
            right: 12,
            opacity: animations.opacity,
            transform: [
              {
                translateY: animations.display
              }
            ]
          }}
        >
          <PressableButton
            testID={notesnook.buttons.add}
            type="accent"
            accentColor={"accent"}
            accentText="light"
            onPress={openEditor}
            customStyle={{
              borderRadius: 100
            }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: normalize(60),
                width: normalize(60)
              }}
            >
              <Icon name="plus" color="white" size={SIZE.xxl} />
            </View>
          </PressableButton>
        </Animated.View>
      }
    >
      <View
        style={{
          maxHeight: 400,
          height: 400,
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            alignItems: "center"
          }}
        >
          <Paragraph size={SIZE.xs} color={colors.icon}>
            TOPICS
          </Paragraph>
          <View
            style={{
              flexDirection: "row"
            }}
          >
            {enabled ? (
              <IconButton
                customStyle={{
                  marginLeft: 10
                }}
                onPress={async () => {
                  //@ts-ignore
                  history.selectedItemsList = selection;
                  presentDialog({
                    title: `Delete ${
                      selection.length > 1 ? "topics" : "topics"
                    }`,
                    paragraph: `Are you sure you want to delete ${
                      selection.length > 1 ? "these topicss?" : "this topics?"
                    }`,
                    positiveText: "Delete",
                    negativeText: "Cancel",
                    positivePress: async () => {
                      await deleteItems();
                      history.selectedItemsList = [];
                      setEnabled(false);
                      setSelection([]);
                    },
                    positiveType: "errorShade"
                  });
                  return;
                }}
                color={colors.pri}
                tooltipText="Move to trash"
                tooltipPosition={1}
                name="delete"
                size={22}
              />
            ) : (
              <IconButton
                name="plus"
                onPress={PLACEHOLDER_DATA.action}
                testID="add-topic-button"
                color={colors.pri}
                size={22}
                customStyle={{
                  width: 40,
                  height: 40
                }}
              />
            )}
          </View>
        </View>
        <SelectionContext.Provider value={selectionContext}>
          <FlatList
            data={topics}
            style={{
              width: "100%"
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  onRequestUpdate();
                }}
                colors={[colors.accent]}
                progressBackgroundColor={colors.bg}
              />
            }
            keyExtractor={(item) => item.id}
            renderItem={renderTopic}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  height: 300
                }}
              >
                <Paragraph color={colors.icon}>No topics</Paragraph>
              </View>
            }
            ListFooterComponent={<View style={{ height: 50 }} />}
          />
        </SelectionContext.Provider>
      </View>
    </ActionSheet>
  );
};

const SelectionContext = createContext<{
  selection: TopicType[];
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggleSelection: (item: TopicType) => void;
}>({
  selection: [],
  enabled: false,
  setEnabled: (value: boolean) => {},
  toggleSelection: (item: TopicType) => {}
});
const useSelection = () => useContext(SelectionContext);

const TopicItem = ({ item, index }: { item: TopicType; index: number }) => {
  const screen = useNavigationStore((state) => state.currentScreen);
  const colors = useThemeStore((state) => state.colors);
  const selection = useSelection();
  const isSelected =
    selection.selection.findIndex((selected) => selected.id === item.id) > -1;
  const isFocused = screen.id === item.id;
  const notesCount = getTotalNotes(item);

  return (
    <PressableButton
      type={isSelected || isFocused ? "grayBg" : "transparent"}
      onLongPress={() => {
        if (selection.enabled) return;
        selection.setEnabled(true);
        selection.toggleSelection(item);
      }}
      testID={`topic-sheet-item-${index}`}
      onPress={() => {
        if (selection.enabled) {
          selection.toggleSelection(item);
          return;
        }
        TopicNotes.navigate(item, true);
      }}
      customStyle={{
        justifyContent: "space-between",
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 12,
        borderRadius: 0
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {selection.enabled ? (
          <IconButton
            size={SIZE.lg}
            color={isSelected ? colors.accent : colors.icon}
            name={
              isSelected
                ? "check-circle-outline"
                : "checkbox-blank-circle-outline"
            }
          />
        ) : null}
        <Paragraph size={SIZE.sm}>
          {item.title}{" "}
          {notesCount ? (
            <Paragraph size={SIZE.xs} color={colors.icon}>
              {notesCount}
            </Paragraph>
          ) : null}
        </Paragraph>
      </View>
      <IconButton
        name="dots-horizontal"
        customStyle={{
          width: 40,
          height: 40
        }}
        testID={notesnook.ids.notebook.menu}
        onPress={() => {
          Properties.present(item);
        }}
        left={0}
        right={0}
        bottom={0}
        top={0}
        color={colors.pri}
        size={SIZE.xl}
      />
    </PressableButton>
  );
};
