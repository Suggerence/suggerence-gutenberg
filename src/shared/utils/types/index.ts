interface BlockAttributeSchema {
    type: string;
    source?: string;
    selector?: string;
    attribute?: string;
    query?: Record<string, any>;
    default?: any;
    enum?: string[];
    role?: string;
    description?: string;
}

interface BlockSchema {
    name: string;
    title: string;
    description?: string;
    category: string;
    icon?: any;
    keywords?: string[];
    attributes: Record<string, BlockAttributeSchema>;
    supports?: Record<string, any>;
    example?: Record<string, any>;
}

interface BlockSupports {
    color?: {
        background?: boolean;
        text?: boolean;
        gradients?: boolean;
        duotone?: boolean;
        link?: boolean;
        heading?: boolean;
    };
    typography?: {
        fontSize?: boolean;
        fontFamily?: boolean;
        fontWeight?: boolean;
        fontStyle?: boolean;
        lineHeight?: boolean;
        letterSpacing?: boolean;
        textDecoration?: boolean;
        textTransform?: boolean;
    };
    spacing?: {
        padding?: boolean;
        margin?: boolean;
        blockGap?: boolean;
    };
    border?: {
        color?: boolean;
        radius?: boolean;
        style?: boolean;
        width?: boolean;
    };
    __experimentalBorder?: {
        color?: boolean;
        radius?: boolean;
        style?: boolean;
        width?: boolean;
        __experimentalSkipSerialization?: boolean;
        __experimentalDefaultControls?: {
            color?: boolean;
            radius?: boolean;
            width?: boolean;
        };
    };
    dimensions?: {
        minHeight?: boolean;
        aspectRatio?: boolean;
    };
    position?: {
        sticky?: boolean;
    };
    layout?: boolean | object;
    anchor?: boolean;
    className?: boolean;
    customClassName?: boolean;
    align?: boolean | string[];
    alignWide?: boolean;
    multiple?: boolean;
    inserter?: boolean;
    lock?: boolean;
    html?: boolean;
    reusable?: boolean;
}