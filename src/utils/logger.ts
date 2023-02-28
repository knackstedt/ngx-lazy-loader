
export const Logger = (context: string, contextColor: string, textColor: string = "#03a9f4") => ({

    log: (message: string, ...args) => {
        console.log(`%c[${context}] %c${message}`, 'color: ' + contextColor, 'color: ' + textColor, ...args);
    },
    warn: (message: string, ...args) => {
        console.warn(`%c[${context}] %c${message}`, 'color: ' + contextColor, 'color: ' + textColor, ...args);
    },

    err: (message: string, ...args) => {
        console.error(`%c[${context}] %c${message}`, 'color: ' + contextColor, 'color: ' + textColor, ...args);
    },
    error: (message: string, ...args) => {
        console.error(`%c[${context}] %c${message}`, 'color: ' + contextColor, 'color: ' + textColor, ...args);
    }

});
