interface CommandBoxProps {
    onClose?: () => void;
    onExecute?: (command: string | any) => Promise<boolean>;
    placeholder?: string;
    mode?: 'default' | 'image-edit';
}