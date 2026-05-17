import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedText } from '@/hooks/use-animated-text';
import { useIntegratedAi } from '@/hooks/use-integrated-ai';
import { toast } from '@/hooks/use-toast';

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const getImageKey = file => `${file.name}:${file.size}:${file.lastModified}`;

export default function IntegratedAiChat({ maxLength = 2000, onMessageSent, defaultImages = [], placeholder = "Type your message here..." }) {
	const [input, setInput] = useState('');
	const [selectedImages, setSelectedImages] = useState(defaultImages);
	const { messages, isStreaming, isLoadingHistory, sendMessage, clearMessages } = useIntegratedAi();
	const messagesEndRef = useRef(null);
	const fileInputRef = useRef(null);

	const imagePreviews = useMemo(() => selectedImages.map(file => ({
		key: getImageKey(file),
		file,
		url: URL.createObjectURL(file),
	})), [selectedImages]);

	useEffect(() => () => {
		imagePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
	}, [imagePreviews]);

	const lastMessage = messages[messages.length - 1];
	const isLastMessageStreaming = isStreaming && lastMessage?.role === 'assistant';
	const animatedText = useAnimatedText(isLastMessageStreaming ? lastMessage.content : '');

	useEffect(() => {
		const scrollToBottom = () => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({
					behavior: 'smooth',
					block: 'end',
				});
			}
		};

		scrollToBottom();
	}, [messages]);

	const handleInputChange = (e) => {
		const val = e.target.value;
		if (val.length <= maxLength) {
			setInput(val);
		} else {
			setInput(val.substring(0, maxLength));
			toast({
				variant: 'destructive',
				title: 'Character limit reached',
				description: `Maximum ${maxLength} characters allowed.`,
			});
		}
	};

	const handleSubmit = useCallback(async (e) => {
		e.preventDefault();

		const trimmed = input.trim();

		if ((!trimmed && selectedImages.length === 0) || isStreaming) {
			return;
		}

		if (trimmed.length > maxLength) {
			toast({
				variant: 'destructive',
				title: 'Error',
				description: `Message exceeds ${maxLength} characters.`,
			});
			return;
		}

		setInput('');
		await sendMessage(trimmed, selectedImages);
		setSelectedImages([]);
		
		if (onMessageSent) {
			onMessageSent();
		}
	}, [input, selectedImages, isStreaming, sendMessage, maxLength, onMessageSent]);

	const handleImageSelect = useCallback((e) => {
		const files = Array.from(e.target.files || []);
		const validFiles = files.filter(file => {
			if (!VALID_IMAGE_TYPES.includes(file.type)) {
				toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only JPG, PNG, and WebP are supported.' });
				return false;
			}
			if (file.size > MAX_IMAGE_SIZE) {
				toast({ variant: 'destructive', title: 'File too large', description: 'Maximum image size is 5MB.' });
				return false;
			}
			return true;
		});

		setSelectedImages((prev) => {
			const uniqueFilesMap = new Map(prev.map(file => [getImageKey(file), file]));
			validFiles.forEach(file => uniqueFilesMap.set(getImageKey(file), file));
			return Array.from(uniqueFilesMap.values()).slice(0, MAX_IMAGES);
		});

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [fileInputRef]);

	const removeImage = useCallback((index) => {
		setSelectedImages(prev => prev.filter((_, i) => i !== index));
	}, []);

	const charCount = input.length;
	const isNearLimit = charCount > maxLength * 0.75;
	const isAtLimit = charCount >= maxLength;

	return (
		<div className="flex flex-col h-full w-full">
			<div className="flex items-center justify-between p-4 border-b bg-muted/30">
				<h2 className="text-lg font-semibold">AI Assistant</h2>
			{messages.length > 0 && (
				<button
					onClick={clearMessages}
					disabled={isStreaming}
					className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Clear History
				</button>
			)}
			</div>

			<div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
				{isLoadingHistory && (
					<div className="text-center text-sm text-muted-foreground py-4">Loading history...</div>
				)}
				{messages.map((msg, i) => {
					const isLastStreamingMessage = isStreaming && i === messages.length - 1 && msg.role === 'assistant';
					const displayContent = isLastStreamingMessage ? animatedText : msg.content;

					return (
						<div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
							<div
								className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
									msg.role === 'user'
										? 'bg-primary text-primary-foreground rounded-br-sm'
										: 'bg-muted text-foreground rounded-bl-sm border'
								}`}
							>
								<p className="whitespace-pre-wrap leading-relaxed">{displayContent}</p>
								{msg.images?.length > 0 && (
									<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
										{msg.images.map((url, j) => (
											<img
												key={j}
												src={url}
												alt="AI generated"
												className="rounded-lg max-w-full border shadow-sm"
											/>
										))}
									</div>
								)}
								{msg.role === 'assistant' && isStreaming && i === messages.length - 1 && !msg.content && (
									<span className="inline-block w-2 h-4 bg-muted-foreground animate-pulse" />
								)}
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			<div className="p-4 border-t bg-background">
				{selectedImages.length > 0 && (
					<div className="mb-3 flex gap-2 flex-wrap">
						{imagePreviews.map(({ key, file, url }, index) => (
							<div key={key} className="relative group">
								<img
									src={url}
									alt={file.name}
									className="w-16 h-16 object-cover rounded-lg border shadow-sm"
								/>
								<button
									type="button"
									onClick={() => removeImage(index)}
									className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-destructive/90 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
								>
									×
								</button>
							</div>
						))}
					</div>
				)}
				<form onSubmit={handleSubmit} className="flex flex-col gap-2 w-full">
					<div className="flex gap-3 w-full">
						<input
							ref={fileInputRef}
							type="file"
							accept={VALID_IMAGE_TYPES.join(',')}
							multiple
							onChange={handleImageSelect}
							className="hidden"
							disabled={isStreaming || isLoadingHistory}
						/>
						<button
							type="button"
							onClick={() => fileInputRef.current?.click()}
							className="rounded-xl border bg-muted/50 px-4 py-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
							disabled={isStreaming || isLoadingHistory || selectedImages.length >= MAX_IMAGES}
							title="Upload images (Max 5MB)"
						>
							📎
						</button>
						<input
							type="text"
							value={input}
							onChange={handleInputChange}
							placeholder={placeholder}
							className="flex-1 rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
							disabled={isStreaming || isLoadingHistory}
						/>
						<button
							type="submit"
							disabled={isStreaming || (!input.trim() && selectedImages.length === 0) || isAtLimit}
							className="rounded-xl bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
						>
							Send
						</button>
					</div>
					<div className="flex justify-end px-1">
						<span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-orange-500' : 'text-muted-foreground'}`}>
							{charCount} / {maxLength} characters {isAtLimit && '(Maximum reached)'}
						</span>
					</div>
				</form>
			</div>
		</div>
	);
}