# Cerial

Cerial is a library for working with serializable objects and data structures in TypeScript. It allows you to define and manage the serialization and deserialization of objects, making it easier to work with binary data in your applications.

### Installation

You can install the library using npm:

```sh
npm install cerial
```

## Usage

The easiest way to use Cerial is with decorators. You will need to have `experimentalDecorators` set to `true` in your TS config.

```ts
import { serial, SerialStatic } from 'cerial';

class _Example {
	@serial('Int16')
	someProp: number;

	@serial('Float32', 7) // 7 element maximum
	array: number[];

	@serial('string', 20) // 20 character maximum
	whoa: string;
}

// this is needed because of https://github.com/Microsoft/TypeScript/issues/4881
const Example = _Example as SerialStatic<typeof _Example>;

// create an instance and give it some data
const myExample = new Example();
myExample.someProp = 400;
myExample.array = [3.14, 1.59];
myExample.whoa = 'Not quite magic';

// turn it into an Uint8Array
const binaryData = myExample.serialize();

// now you can send myExample as binary, for example to a file
import { writeFileSync, readFileSync } from 'node:fs';
writeFileSync('example.bin', binaryData);

// then, later
const dataFromFile = readFileSync('example.bin');

const myNewExample = Example.Deserialize(dataFromFile);
console.log(myNewExample.whoa); // "Not quite magic"
```

#### Other decorators

`serial` and `serialize` are aliases of `serialMember`, which makes a member serializable. A decorator called `serialClass` is also provided which allows the user to specify configuration for serialization.

#### `sizeof`

The `sizeof` function allows you to calculate the size of a serializable value in bytes, which can be useful for working with binary data buffers.

```ts
sizeof(myExample); // 50 (2 for someProp, 4 * 7 = 28 for array, and 20 for whoa)
sizeof(Example); // also 50
```

## Testing and contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the GitHub repository.

To run tests:

```sh
npm run test
```
