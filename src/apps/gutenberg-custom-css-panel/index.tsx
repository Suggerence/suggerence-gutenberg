import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { TextareaControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

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

	const handleCssChange = (value: string) => {
		setMeta({
			...(meta ?? {}),
			suggerence_custom_css: value,
		});
	};

	if (!postType || !setMeta) {
		return null;
	}

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

	return (
		<PluginDocumentSettingPanel
			name="suggerence-post-custom-css"
			title={__('Suggerence: Custom CSS', 'suggerence')}
			className="suggerence-post-custom-css-panel"
		>
			<TextareaControl
				label={__('Per-post CSS', 'suggerence')}
				help={helpText}
				value={currentCss}
				onChange={handleCssChange}
				rows={8}
			/>
		</PluginDocumentSettingPanel>
	);
};
