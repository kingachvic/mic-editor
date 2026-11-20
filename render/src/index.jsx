// The scenes to render come from src/scenes.js, written by the notebook from your Kaggle dataset.
import {registerRoot} from 'remotion';
import {makeRoot} from './engine.js';
import SCENES from './scenes.js';

registerRoot(makeRoot(SCENES));
