/// <reference types="react" />
declare type TableSize = {
    columns: number;
    rows: number;
};
export declare type TablePopupProps = {
    onClose: (size: TableSize) => void;
};
export declare function TablePopup(props: TablePopupProps): JSX.Element;
export {};
