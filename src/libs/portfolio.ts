import { css, html, LitElement, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators';

// FIXME: introduce this construct when the
// import styles from '../styles/portfolio.css' assert { type: 'css' }

@customElement('tl-portfolio')
export class Portoflio extends LitElement {
	static get styles() {
		return [
			css`
        :host {
            padding: 2rem;
        }
      `,
		];
	}

	render() {
		return html`
            <h1>Hello from LitElement!</h1>
            <button @click="${this.clickHandler}">Click Me</button>
        `;
	}

	clickHandler(event: Event) {
		alert('clicked: ' + event.target);
	}
}

export function presentPortfolio(domElement: Element) {
	domElement.replaceWith(document.createElement('tl-portfolio'));
}
