import { defineFunction } from '@aws-amplify/backend';

export const sayHello = defineFunction({
  name: 'say-hello',
  entry: './handler.ts', // Point to your python file
});