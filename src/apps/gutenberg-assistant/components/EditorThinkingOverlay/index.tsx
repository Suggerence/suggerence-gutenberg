import { __ } from '@wordpress/i18n';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { createPortal } from 'react-dom';

const TARGET_SELECTORS = [
    '.interface-interface-skeleton__content',
    '.edit-post-visual-editor',
    '.editor-styles-wrapper'
];

const filterNestedTargets = (nodes: HTMLElement[]) => {
    return nodes.filter((node) => !nodes.some((other) => other !== node && other.contains(node)));
};

type EditorThinkingOverlayProps = {
    active: boolean;
    label?: string;
};

const applyTargetState = (target: HTMLElement, label: string) => {
    target.classList.add('suggerence-editor-overlay-container');
    target.setAttribute('data-suggerence-overlay-label', label);
    target.setAttribute('aria-busy', 'true');
    target.setAttribute('inert', '');
};

const clearTargetState = (target: HTMLElement) => {
    target.classList.remove('suggerence-editor-overlay-container');
    target.removeAttribute('data-suggerence-overlay-label');
    target.removeAttribute('aria-busy');
    target.removeAttribute('inert');
};

export const EditorThinkingOverlay = ({
    active,
    label = __('Suggie is working on it...', 'suggerence')
}: EditorThinkingOverlayProps) => {
    const [targets, setTargets] = useState<HTMLElement[]>([]);

    useEffect(() => {
        if (!active || typeof document === 'undefined') {
            setTargets([]);
            return;
        }

        let cancelled = false;

        const collectTargets = () => {
            if (cancelled) {
                return;
            }
            const nodes: HTMLElement[] = [];
            TARGET_SELECTORS.forEach((selector) => {
                document.querySelectorAll(selector).forEach((node) => {
                    if (node instanceof HTMLElement) {
                        nodes.push(node);
                    }
                });
            });

            const prioritizedNodes = filterNestedTargets(nodes);

            setTargets((current) => {
                const sameLength = current.length === prioritizedNodes.length;
                if (sameLength && current.every((node, index) => node === prioritizedNodes[index])) {
                    return current;
                }
                return prioritizedNodes;
            });
        };

        collectTargets();

        const observer = new MutationObserver(collectTargets);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            cancelled = true;
            observer.disconnect();
            setTargets([]);
        };
    }, [active]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }
        const body = document.body;
        if (active) {
            body.classList.add('suggerence-editor-locked');
        } else {
            body.classList.remove('suggerence-editor-locked');
        }

        return () => {
            body.classList.remove('suggerence-editor-locked');
        };
    }, [active]);

    useEffect(() => {
        if (!active) {
            targets.forEach(clearTargetState);
            return;
        }

        targets.forEach((target) => applyTargetState(target, label));

        return () => {
            targets.forEach(clearTargetState);
        };
    }, [active, label, targets]);

    if (!active || targets.length === 0) {
        return null;
    }

    return (
        <Fragment>
            {targets.map((target, index) =>
                createPortal(
                    (
                        <div className="suggerence-editor-overlay" aria-hidden="true">
                            <div className="suggerence-editor-overlay__backdrop" />
                            {label && (
                                <div className="suggerence-editor-overlay__label">
                                    {label}
                                </div>
                            )}
                        </div>
                    ),
                    target,
                    `suggerence-editor-overlay-${index}`
                )
            )}
        </Fragment>
    );
};
