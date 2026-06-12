





class CardElem extends HTMLElement {
    static observedAttributes = ['card-id', 'face-down', 'foil'];

    constructor() {
      super();
  }
}

customElements.define('game-card', CardElem);