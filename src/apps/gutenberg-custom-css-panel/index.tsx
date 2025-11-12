import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { BaseControl, TextareaControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';

export const PostCustomCssPanel = () => {
	const { postType, postId } = useSelect((select) => {
		const editor = select('core/editor');

		return {
			postType: editor.getCurrentPostType(),
			postId: editor.getCurrentPostId(),
		};
	}, []);

	const [meta, setMeta] = useEntityProp(
		'postType',
		postType ?? 'post',
		'meta'
	);

	const currentCss = meta?.suggerence_custom_css ?? '';

	const handleCssChange = useCallback((value: string) => {
		setMeta({
			...(meta ?? {}),
			suggerence_custom_css: value,
		});
	}, [meta, setMeta]);

	if (!postType || !setMeta) {
		return null;
	}

	const codeEditorSettings = (window as any)?.SuggerenceCustomCssEditorSettings;

	const editorSettings = useMemo(() => {
		if (!codeEditorSettings) {
			return null;
		}

		return {
			...codeEditorSettings,
			codemirror: {
				...(codeEditorSettings.codemirror ?? {}),
				mode: 'css',
				lineNumbers: true,
				indentUnit: 2,
			},
		};
	}, [codeEditorSettings]);

	const helpText = postId
		? sprintf(
			__(
				'CSS added here is scoped automatically with `body.postid-%d` so it only affects this post.',
				'suggerence'
			),
			postId
		)
		: __(
			'CSS added here is scoped automatically with `body.postid-[ID]` so it only affects this post.',
			'suggerence'
		);

	const wpCodeEditor = (window as any)?.wp?.codeEditor;
	const canUseCodeEditor = Boolean(editorSettings && wpCodeEditor?.initialize);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const codeMirrorRef = useRef<any>();
	const latestMetaRef = useRef(meta);

	useEffect(() => {
		latestMetaRef.current = meta;
	}, [meta]);

	useEffect(() => {
		if (!canUseCodeEditor || !textareaRef.current || !editorSettings) {
			return;
		}

		const textareaNode = textareaRef.current;
		const instance = wpCodeEditor.initialize(textareaNode, editorSettings);
		codeMirrorRef.current = instance?.codemirror;

		const handleEditorChange = () => {
			const value = codeMirrorRef.current?.getValue?.() ?? '';
			setMeta({
				...(latestMetaRef.current ?? {}),
				suggerence_custom_css: value,
			});
		};

		codeMirrorRef.current?.on('change', handleEditorChange);

		return () => {
			if (codeMirrorRef.current) {
				codeMirrorRef.current.off('change', handleEditorChange);
				codeMirrorRef.current.toTextArea();
				codeMirrorRef.current = undefined;
			}
		};
	}, [canUseCodeEditor, editorSettings, setMeta, wpCodeEditor]);

	useEffect(() => {
		const codeMirror = codeMirrorRef.current;
		if (codeMirror && codeMirror.getValue() !== currentCss) {
			codeMirror.setValue(currentCss);
			return;
		}

		if (!codeMirror && textareaRef.current && textareaRef.current.value !== currentCss) {
			textareaRef.current.value = currentCss;
		}
	}, [currentCss]);

	return (
		<PluginDocumentSettingPanel
			name="suggerence-post-custom-css"
			title={__('Suggerence: Custom CSS', 'suggerence')}
			className="suggerence-post-custom-css-panel"
		>
			{canUseCodeEditor ? (
				<BaseControl
					label={__('Per-post CSS', 'suggerence')}
					help={helpText}
				>
					<textarea
						ref={textareaRef}
						defaultValue={currentCss}
						className="components-textarea-control__input"
					></textarea>
				</BaseControl>
			) : (
				<TextareaControl
					label={__('Per-post CSS', 'suggerence')}
					help={helpText}
					value={currentCss}
					onChange={handleCssChange}
					rows={8}
				/>
			)}
		</PluginDocumentSettingPanel>
	);
};
