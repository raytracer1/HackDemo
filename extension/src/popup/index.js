import { setRender } from './state.js';
import { render } from './App.js';

// Register render function
setRender(render);

// Initial render
render();
