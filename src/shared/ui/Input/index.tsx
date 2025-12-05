import { TextControl } from "@wordpress/components"

export const Input = (props: {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    ref?: React.RefObject<HTMLInputElement>;
}) => {
    return (
        <TextControl
            __next40pxDefaultSize
            value={props.value}
            onChange={(value) => props.onChange(value)}
            required={props.required}
            disabled={props.disabled}
            placeholder={props.placeholder}
            ref={props.ref}
        />
    )
}