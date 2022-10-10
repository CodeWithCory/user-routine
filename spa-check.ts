import { SpaCheckAction, SpaCheckActionFunction, SpaCheckActionString, SpaCheckOptions, SpaCheckReturn } from './spa-check.d';

/**
 * Automated testing for single-page applications (SPAs). Small, portable, and easy to use. Click on things, fill in values, check if things exist, etc.
 * @example new SpaCheck(['click button.some-class', 'value form>input Hello, world!', 'exists .success-message'], {message: "See if the feature works", globalDelay: 1000});
 * @param actionList Available actions types: click, exists, includes, log, nav, value, write, or provide a custom function
 * @param options Available options: continueOnFailure, globalDelay, logUpdates, message, messageStyle, messageShowInDOM
 */
export async function spaCheck(actionList: SpaCheckAction[], options?: SpaCheckOptions): Promise<SpaCheckReturn> {

  const defaultConfig = {
    continueOnFailure: false,
    globalDelay: 500,
    logUpdates: true,
    message: '',
    messageShowInDOM: false,
    messageStyle: 'font-size:24px; padding:10px; z-index:9999; position:fixed; top:0; right:10%; color:black; background-color:rgba(222,222,222,0.8);',
  };
  const updateList: string[] = [];
  const config: SpaCheckOptions = { ...defaultConfig, ...options };
  let errorOccurred = false;
  let msgElement: HTMLElement | undefined = undefined;
  let continueActions = true;

  this.main = async (actionList: SpaCheckAction[]) => {
    this.messageStart();
    for (const action of actionList) {
      if (!continueActions) { return this.finish() }
      await this.sleep(config.globalDelay);
      try {
        await this.do(action);
      } catch (error) {
        console.error('Unexpected error received', error);
      }
    }
    return this.finish();
  }
  
  this.finish = (): SpaCheckReturn => {
    const result = !errorOccurred;
    this.log(`Done, success: ${result}`);
    this.messageEnd();
    return { result, updateList: updateList };
  }

  this.do = (action: SpaCheckAction) => {
    if (typeof action === 'string') {
      this.doActionString(action as SpaCheckActionString)
    } else if (typeof action === 'function') {
      try {
        (action as SpaCheckActionFunction)();
      } catch (error) {
        this.error('Error running provided function', error + '; function: ' + action.toString());
      }
    } else {
      this.error('Action is not of type string or function, got', typeof action);
    }
  }

  this.doActionString = (action: SpaCheckActionString) => {
    const actionCode = action.substring(0, 3);
    if (actionCode === 'nav') {
      const location = action.split(' ')[1]
      if (location && location[0] === '#') {
        window.location.href = location;
        this.log(`Navigated to ${location}`);
      } else {
        this.error(`Unexpected nav action, got`, action);
      }

    } else if (actionCode === 'cli') {
      const selector = action.split(' ')[1];
      const element = this.select(selector);
      if (!element) return;
      element.click();
      this.log(`Clicked on ${selector}`);

    } else if (actionCode === 'exi') {
      const selector = action.split(' ')[1];
      const element = this.select(selector);
      if (!element) return;
      this.log(`Verified ${selector} exists`);

    } else if (actionCode === 'val') {
      const [_, selector, value] = this.argSplit(action);
      const element = this.select(selector);
      if (!element) return;
      this.select(selector).value = value;
      this.log(`Set the value of ${selector} to ${value}`);

    } else if (actionCode === 'inc') {
      const [_, selector, text] = this.argSplit(action);
      const element = this.select(selector);
      if (!element) return;
      if (element.innerText.indexOf(text) === -1) {
        this.error('Text not found', text);
      } else {
        this.log(`Verified ${selector} includes "${text}"`);
      }

    } else if (actionCode === 'wri') {
      const [_, selector, text] = this.argSplit(action);
      const element = this.select(selector);
      if (!element) return;
      element.textContent += text;
      this.log(`Wrote "${text}" at the end of ${selector}`);

    } else if (actionCode === 'log') {
      const [_, value] = action.split(/ (.*)/s);
      console.log('* ' + value);
    } else if (action === '') {
      /* Do nothing, just add an extra globalDelay */
    } else {
      this.error('Action string keyword not recognized, got', action);
    }
  }

  this.select = (selector: string): HTMLElement & HTMLInputElement => {
    const element = document.querySelector(selector) as HTMLElement & HTMLInputElement;
    if (!element) {
      this.error('CSS Selector not found', selector);
    }
    return element;
  }

  this.argSplit = (action): string[] => {
    const split = action.split(/ ([^\s]+) (.*)/s);
    if (split.length < 3) {
      this.error(`Unexpected ${split[0]} input, got:`, action);
    }
    return split
  }

  this.messageStart = () => {
    console.group(`[SPA Check] ${config.message}`);
    msgElement = config.messageShowInDOM && config.message ? this.displayMessageInDOM(config.message, config.messageStyle) : undefined;
  }

  this.messageEnd = () => {
    if (msgElement) { msgElement.remove() };
    console.groupEnd();
  }

  this.displayMessageInDOM = (message: string, messageStyle: string) => {
    const msgElement = document.createElement('p');
    msgElement.textContent = message;
    msgElement.setAttribute('style', messageStyle);
    document.querySelector('body')?.appendChild(msgElement);
    return msgElement;
  }

  this.log = (message: string) => {
    updateList.push(message);
    const updateMessage = `* ${message}`;
    if (config.logUpdates) {
      console.log(updateMessage);
    }
  }

  this.error = (message: string, value: string, continueOnFailure = config.continueOnFailure) => {
    errorOccurred = true;
    const errorMessage = `${message}: '${value}'`;
    updateList.push(errorMessage);
    if (continueOnFailure) {
      console.error(`* ${errorMessage}. Continuing execution.`);
    } else {
      continueActions = false;
      throw new Error(`${errorMessage}. Halting execution.`);
    }
  }

  this.sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  return await this.main(actionList);
}
