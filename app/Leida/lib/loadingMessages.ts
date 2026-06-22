const loadingMessages = [
	'Herding pandas...',
    'Authorise Yoself...',
    'Counting sheep...',
];

const getRandomLoadingMessage = () => {
	const randomIndex = Math.floor(Math.random() * loadingMessages.length);
	return loadingMessages[randomIndex] || 'Authorising...';
};

export {
	loadingMessages,
	getRandomLoadingMessage,
};
