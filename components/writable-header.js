const writableHeaderStyleSheet = new CSSStyleSheet();
writableHeaderStyleSheet.replaceSync(`
`);

class WritableHeader extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [writableHeaderStyleSheet];
	}

	connectedCallback() {
		this.slotElement = document.createElement('slot');
		this.shadowRoot.append(this.slotElement);

		this.slotElement.addEventListener('slotchange', () => {
			this.wireHeader();
		});
		this.wireHeader();
	}

	wireHeader() {
		// if we have no slot elements, do nothing
		if (this.slotElement.assignedElements().length === 0) {
			return;
		}

		// make header editable
		const headerElement = this.slotElement.assignedElements().at(0);
		headerElement.contentEditable = true;

		// save existing text content as a fallback, if this element is ever cleared
		this.fallback = headerElement.textContent;

		// wire input handler for the page title
		headerElement.addEventListener('input', () => {
			// update document title
			this.ownerDocument.title = headerElement.textContent;

			// update query parameter
			const url = new URL(window.location.href);
			url.searchParams.set('pageTitle', headerElement.textContent);
			window.history.replaceState(null, '', url.toString());
		});

		headerElement.addEventListener('blur', () => {
			// if the page title was emptied, reset it
			if (headerElement.textContent === '') {
				// update element
				headerElement.textContent = this.fallback;

				// update document title (first try audio file name, then fallback to this element)
				this.ownerDocument.title = fileInput.files?.[0]?.name || headerElement.textContent;

				// remove query parameter
				const url = new URL(window.location.href);
				url.searchParams.delete('pageTitle');
				window.history.replaceState(null, '', url.toString());
			}
		});

		// load page title if we already have one in the URL on page load
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.has('pageTitle')) {
			headerElement.textContent = searchParams.get('pageTitle');
			document.title = searchParams.get('pageTitle');
		}
	}

	isDefault() {
		return this.textContent.trim() === this.fallback;
	}
}

customElements.define('writable-header', WritableHeader);
