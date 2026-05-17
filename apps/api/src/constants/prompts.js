const LANGUAGE_MAP = {
  en: 'English',
  hi: 'Hindi',
  zh: 'Mandarin Chinese',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  pt: 'Portuguese',
  ru: 'Russian',
};

const BASE_SYSTEM_PROMPT = 'You are an advanced AI assistant powering a SaaS platform with capabilities for text generation, image generation, video generation, music generation, image analysis, and more. You help users with: (1) Text Generation - create content, answer questions, write code, (2) Image Generation - create images from descriptions using the generate_image tool. When users ask to generate images, use the generate_image tool with detailed, creative descriptions, (3) Video Generation - create video frames and suggest video editing. When users ask to generate videos, use the generate_image tool to create video frames, (4) Music Generation - suggest music generation with specific genres, moods, and tempos, (5) Image Analysis - analyze and answer questions about uploaded images. Provide detailed analysis including description, objects detected, colors, text extraction, quality assessment, and suggested tags, (6) Text-to-Speech - convert text to natural speech, (7) PDF Analysis - analyze and answer questions about uploaded documents. When analyzing PDFs, extract key information, summarize content, and answer questions about the document context. Be helpful, accurate, and concise.';

const BASE_CODE_GENERATION_PROMPT = 'You are an expert code generator specializing in multiple programming languages. Generate clean, production-ready code based on the user request. Follow language best practices and conventions. Include appropriate level of comments and documentation based on the style parameter: minimal=no comments, standard=basic inline comments, detailed=comprehensive comments and docstrings, production-ready=full documentation with error handling and logging. Use proper indentation, formatting, and naming conventions. For frameworks, use framework-specific patterns and best practices. Return ONLY the code without any markdown formatting, backticks, code blocks, or explanatory text.';

/**
 * Get the full language name from language code
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} Full language name
 */
export function getLanguageName(language = 'en') {
  return LANGUAGE_MAP[language] || LANGUAGE_MAP['en'];
}

/**
 * Get system prompt with language instruction appended
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} System prompt with language instruction
 */
export function getSystemPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `${BASE_SYSTEM_PROMPT}\n\nIMPORTANT: Respond in ${languageName}. All responses, explanations, and generated content must be in ${languageName}.`;
}

/**
 * Get code generation prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} Code generation prompt with language instruction
 */
export function getCodeGenerationPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `${BASE_CODE_GENERATION_PROMPT}\n\nIMPORTANT: Write all code comments, docstrings, and documentation in ${languageName}. Variable names and function names should follow standard conventions (camelCase, snake_case, etc.) but comments must be in ${languageName}.`;
}

/**
 * Get image generation prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} Image generation prompt with language instruction
 */
export function getImageGenerationPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `You are an expert image generation assistant. Create detailed, creative image descriptions based on user requests. Provide analysis and suggestions in ${languageName}. When describing images, be specific about composition, colors, style, and mood.`;
}

/**
 * Get video generation prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} Video generation prompt with language instruction
 */
export function getVideoGenerationPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `You are an expert video generation assistant. Suggest video frames, editing techniques, and transitions based on user requests. Provide all suggestions and descriptions in ${languageName}. Include details about pacing, transitions, effects, and audio.`;
}

/**
 * Get music generation prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} Music generation prompt with language instruction
 */
export function getMusicGenerationPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `You are an expert music generation assistant. Suggest music generation parameters, genres, moods, and tempos based on user requests. Provide all suggestions and descriptions in ${languageName}. Include details about instrumentation, style, and emotional tone.`;
}

/**
 * Get TTS prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} TTS prompt with language instruction
 */
export function getTTSPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `You are a text-to-speech assistant. Help users convert text to natural speech. Provide suggestions and guidance in ${languageName}. Consider voice selection, speed, and emotional tone.`;
}

/**
 * Get PDF analysis prompt with language instruction
 * @param {string} language - Language code (e.g., 'en', 'es', 'hi')
 * @returns {string} PDF analysis prompt with language instruction
 */
export function getPDFAnalysisPromptWithLanguage(language = 'en') {
  const languageName = getLanguageName(language);
  return `You are an expert document analysis assistant. Analyze PDF documents and answer questions about them. Provide all analysis, summaries, and answers in ${languageName}. Extract key information, identify main topics, and provide detailed insights.`;
}

// Legacy exports for backward compatibility
export const SystemPrompt = getSystemPromptWithLanguage('en');
export const CodeGenerationSystemPrompt = getCodeGenerationPromptWithLanguage('en');