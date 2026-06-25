const loadingMessages = [
	'loading...',
];

const getRandomLoadingMessage = () => {
	const randomIndex = Math.floor(Math.random() * loadingMessages.length);
	return loadingMessages[randomIndex] || 'Authorising...';
};

export {
	loadingMessages,
	getRandomLoadingMessage,
};
