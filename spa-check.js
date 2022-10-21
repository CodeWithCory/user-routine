var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Automated testing for single-page applications (SPAs). Small, portable, and easy to use. Click on things, fill in values, check if things exist, etc.
 * @example new SpaCheck(['click button.some-class', 'value form>input Hello, world!', 'exists .success-message'], {message: 'See if the feature works', globalDelay: 1000});
 * @param actionList Available actions types: append, await, click, exists, log, nav, value, write, or provide a custom function
 * @param options Available options: awaitTimeout, continueOnFailure, globalDelay, logUpdates, message, messageStyle, messageShowInDOM
 */
export function spaCheck(actionList, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultConfig = {
            continueOnFailure: false,
            globalDelay: 500,
            awaitTimeout: 15000,
            logCollapse: false,
            logResult: true,
            logUpdates: true,
            message: '',
            messageShowInDOM: false,
            messageStyle: 'font-size:24px; padding:10px; z-index:9999; position:fixed; top:0; right:10%; color:black; background-color:rgba(222,222,222,0.8);',
        };
        const updateList = [];
        const config = Object.freeze(Object.assign(Object.assign({}, defaultConfig), options));
        const spaCheckLogTitle = config.message ? `[SPA Check] ${config.message}` : '[SPA Check]';
        let errorOccurred = false;
        let msgElement = undefined;
        let continueActions = true;
        let clickableTextElement = undefined;
        this.main = (actionList) => __awaiter(this, void 0, void 0, function* () {
            yield this.messageStart();
            const inputsValid = this.validateInputs(actionList, options);
            if (!inputsValid)
                return this.finish();
            for (const action of actionList) {
                if (!continueActions) {
                    return this.finish();
                }
                yield this.sleep(config.globalDelay);
                try {
                    yield this.do(action);
                }
                catch (error) {
                    this.error('Unexpected error: ' + error.message);
                }
            }
            return this.finish();
        });
        this.finish = () => {
            const result = !errorOccurred;
            const returnPayload = { success: result, log: updateList, message: config.message };
            this.log(`Done, success: ${result}`);
            this.messageEnd(returnPayload);
            return returnPayload;
        };
        this.do = (action) => __awaiter(this, void 0, void 0, function* () {
            if (typeof action === 'string') {
                yield this.doActionString(action);
            }
            else if (typeof action === 'function') {
                try {
                    yield action();
                    this.log('Ran provided function');
                }
                catch (error) {
                    this.error('Error running provided function', error + '; function: ' + action.toString());
                }
            }
            else {
                this.error('Action is not of type string or function, got', typeof action);
            }
        });
        this.doActionString = (action) => __awaiter(this, void 0, void 0, function* () {
            const actionCode = action.substring(0, 3);
            if (actionCode === 'nav') {
                const location = action.split(' ')[1];
                if (location && location[0] === '#') {
                    window.location.href = location;
                    this.log(`Navigated to ${location}`);
                }
                else {
                    this.error(`Unexpected nav action, got`, action);
                }
            }
            else if (actionCode === 'cli') {
                const [_, selector, value] = this.argSplitComplex(action);
                const clickTarget = this.getTargetText(selector, value);
                if (value) {
                    const elements = document.querySelectorAll(selector);
                    clickableTextElement = undefined;
                    this.findClickableElementWithText(elements, value);
                    if (clickableTextElement) {
                        clickableTextElement.click();
                        this.log(`Clicked text '${value}' inside ${selector} (clicked on ${clickableTextElement.tagName.toLowerCase()})`);
                    }
                    else {
                        this.error(`Could not find selector to click`, clickTarget);
                    }
                    clickableTextElement = undefined;
                }
                else {
                    const element = this.select(selector);
                    if (!element)
                        return;
                    element.click();
                    this.log(`Clicked ${selector}`);
                }
            }
            else if (actionCode === 'exi') {
                const [_, selector, value] = this.argSplitComplex(action);
                const existsTarget = this.getTargetText(selector, value);
                let found = false;
                if (value) {
                    const elements = document.querySelectorAll(selector);
                    for (const element of elements) {
                        if (this.checkIfElementContainsText(element, value)) {
                            found = true;
                            break;
                        }
                    }
                }
                else {
                    const element = document.querySelector(selector);
                    if (element)
                        found = true;
                }
                if (found) {
                    this.log(`Did exist: ${existsTarget}`);
                }
                else {
                    this.error(`Did not exist`, existsTarget);
                }
            }
            else if (actionCode === 'val') {
                const [_, selector, value] = this.argSplit(action);
                const element = this.select(selector);
                if (!element)
                    return;
                this.select(selector).value = value;
                this.log(`Set the value of ${selector} to ${value}`);
            }
            else if (actionCode === 'wri' || actionCode === 'app') {
                const [_, selector, text] = this.argSplit(action);
                const element = this.select(selector);
                if (!element)
                    return;
                if (actionCode === 'wri') {
                    element.textContent = text;
                    this.log(`Wrote '${text}' over ${selector}`);
                }
                else {
                    element.textContent += text;
                    this.log(`Appended '${text}' to ${selector}`);
                }
            }
            else if (actionCode === 'log') {
                const [_, value] = action.split(/ (.*)/s);
                this.log(value);
            }
            else if (actionCode === 'wai') {
                const [_, value] = action.split(' ');
                this.log(`Waiting ${Number(value) / 1000} second(s)`);
                yield this.sleep(Number(value));
            }
            else if (actionCode === 'awa') {
                const [_, selector, value] = this.argSplitComplex(action);
                const loopCount = config.awaitTimeout / config.globalDelay;
                let found = false;
                const awaitingTarget = this.getTargetText(selector, value);
                this.log(`Awaiting ${awaitingTarget}...`);
                for (let i = 0; i < loopCount; i++) {
                    if (value) {
                        /* Check for text */
                        const elements = Array.from(document.querySelectorAll(selector));
                        for (const element of elements) {
                            if (element && element.textContent && element.textContent.toLowerCase().includes(value.toLowerCase())) {
                                found = true;
                                break;
                            }
                        }
                    }
                    else {
                        /* Just check for element */
                        const element = document.querySelector(selector);
                        if (element)
                            found = true;
                    }
                    if (found)
                        break;
                    yield this.sleep(config.globalDelay);
                }
                if (found) {
                    this.log(`...Found ${awaitingTarget}`);
                }
                else {
                    this.error(`Timed out after ${config.awaitTimeout / 1000} second(s) awaiting`, awaitingTarget);
                }
            }
            else if (action === '') {
                /* Do nothing, just add an extra globalDelay */
            }
            else {
                this.error('Action string keyword not recognized, got', action);
            }
        });
        this.select = (selector) => {
            const element = document.querySelector(selector);
            if (!element) {
                this.error('CSS Selector not found', selector);
            }
            return element;
        };
        /**
         * Finds the smallest element containing the given text and assigns it to clickableTextElement
         */
        this.findClickableElementWithText = (elements, text) => {
            for (const element of elements) {
                const elementContainsText = this.checkIfElementContainsText(element, text);
                if (!elementContainsText)
                    continue;
                clickableTextElement = element;
                const clickableChildNodes = Array.from(element.childNodes).filter(e => e.click);
                this.findClickableElementWithText(clickableChildNodes, text);
            }
        };
        this.checkIfElementContainsText = (element, text) => {
            const lowerText = text.toLowerCase();
            const foundInTextContent = element.textContent && element.textContent.toLowerCase().includes(lowerText);
            const foundInValue = typeof element.value === 'string' && element.value.toLocaleLowerCase().includes(lowerText);
            return foundInTextContent || foundInValue;
        };
        this.getTargetText = (selector, value) => {
            return `'${selector}'` + (value ? ` containing text '${value}'` : '');
        };
        this.argSplit = (action) => {
            const split = action.split(/ ([^\s]+) (.*)/s);
            if (split.length < 3) {
                this.error(`Unexpected ${split[0]} input with data, got:`, action);
            }
            return split;
        };
        this.argSplitComplex = (action) => {
            const spaceSplit = action.split(' ');
            return spaceSplit.length > 2 ? this.argSplit(action) : spaceSplit;
        };
        this.messageStart = () => __awaiter(this, void 0, void 0, function* () {
            yield this.sleep(0);
            if (config.logUpdates) {
                if (config.logCollapse) {
                    console.groupCollapsed(spaCheckLogTitle);
                }
                else {
                    console.group(spaCheckLogTitle);
                }
            }
            msgElement = config.messageShowInDOM && config.message ? this.displayMessageInDOM(config.message, config.messageStyle) : undefined;
        });
        this.messageEnd = (returnPayload) => {
            if (msgElement) {
                msgElement.remove();
            }
            ;
            const resultPrepend = config.logUpdates ? '' : spaCheckLogTitle;
            if (config.logResult)
                console.log(`${resultPrepend} Result:`, returnPayload);
            if (config.logUpdates)
                console.groupEnd();
        };
        this.displayMessageInDOM = (message, messageStyle) => {
            var _a;
            const msgElement = document.createElement('p');
            msgElement.textContent = message;
            msgElement.setAttribute('style', messageStyle);
            (_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.appendChild(msgElement);
            return msgElement;
        };
        this.validateInputs = (actionList, options) => {
            let inputsValid = true;
            if (actionList === undefined) {
                inputsValid = false;
                this.error('Missing required argument Action List', '', false);
            }
            else if (!Array.isArray(actionList)) {
                inputsValid = false;
                this.error('Action list argument is not an Array', '', false);
            }
            if (options !== undefined && (typeof options !== 'object' || Array.isArray(options))) {
                inputsValid = false;
                this.error('Options argument is not an Object', '', false);
            }
            return inputsValid;
        };
        this.log = (message) => {
            updateList.push(message);
            const updateMessage = `* ${message}`;
            if (config.logUpdates) {
                console.log(updateMessage);
            }
        };
        this.error = (message, value, continueOnFailure = config.continueOnFailure) => {
            errorOccurred = true;
            const valuePart = value ? `: '${value}'` : '';
            let errorMessage = `FAIL: ${message}` + valuePart;
            if (continueOnFailure) {
                errorMessage += '. Continuing execution.';
            }
            else {
                continueActions = false;
                errorMessage += '. Halting execution.';
            }
            updateList.push(errorMessage);
            console.error(errorMessage);
        };
        this.sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds));
        };
        return yield this.main(actionList);
    });
}