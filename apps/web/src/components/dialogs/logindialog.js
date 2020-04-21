import React, { useState } from "react";
import { Box, Button, Text } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";
import PasswordInput from "../inputs/password";
import Dropper from "../dropper";

const form = { error: true };
function LoginDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isLoggingIn = useStore((store) => store.isLoggingIn);
  const login = useStore((store) => store.login);

  return (
    <Dialog
      isOpen={true}
      title={"Login"}
      icon={Icon.Login}
      onCloseClick={onClose}
      negativeButton={{ onClick: onClose }}
      positiveButton={{
        text: "Login",
        loading: isLoggingIn,
        disabled: isLoggingIn,
        onClick: () => submit(setError, form, login, onClose),
      }}
    >
      <Box
        mt={1}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(setError, form, login, onClose);
        }}
      >
        <Dropper mt={2} form={form}>
          <Input autoFocus name="username" title="Username" />
          <PasswordInput />
        </Dropper>
        <Button variant="anchor" onClick={showSignUpDialog}>
          Create a New Account
        </Button>
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}

function submit(setError, form, login, onClose) {
  setError();
  if (form.error) return;

  login(form)
    .then(onClose)
    .catch((e) => setError(e.message));
}

export const showLogInDialog = () => {
  return showDialog((perform) => <LoginDialog onClose={() => perform()} />);
};
