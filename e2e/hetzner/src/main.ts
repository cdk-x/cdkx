import { App, Stack } from '@cdkx-io/core';

const app = new App();
const stack = new Stack(app, 'MyStack');

// Add your resources here
void stack;

app.synth();