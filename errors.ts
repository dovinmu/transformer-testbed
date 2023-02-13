class ContentLengthExceededError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export {
    ContentLengthExceededError
}