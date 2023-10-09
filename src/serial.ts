/**
 * Represents a directly serializable primitive.
 */
export type SerialPrimitive = 'Int8' | 'Uint8' | 'Int16' | 'Uint16' | 'Int32' | 'Uint32' | 'BigInt64' | 'BigUint64' | 'Float32' | 'Float64';

/**
 * Represents the corresponding Javascript types for serial primitives.
 */
export type PrimitiveValue<P extends SerialPrimitive = SerialPrimitive> = P extends 'BigInt64' | 'BigUint64' ? bigint : number;

/**
 * Get the JavaScript type name for a given serial primitive.
 * @param serialType The serial primitive type.
 * @returns The JavaScript type name as a string.
 */
export function serialPrimitiveValue(serialType: SerialPrimitive): string {
	return serialType == 'BigInt64' || serialType == 'BigUint64' ? 'bigint' : 'number';
}

/**
 * An array containing all serial primitive types.
 */
export const serialPrimitives: SerialPrimitive[] = ['Int8', 'Uint8', 'Int16', 'Uint16', 'Int32', 'Uint32', 'BigInt64', 'BigUint64', 'Float32', 'Float64'];

/**
 * Checks if a value is a valid serial primitive.
 * @param arg The value to check.
 * @returns True if the value is a serial primitive, otherwise false.
 */
export function isSerialPrimitive(arg: unknown): arg is SerialPrimitive {
	return (serialPrimitives as unknown[]).includes(arg);
}

/**
 * Represents a serial type, which can be a serial primitive, a `Serializable` class, or a string.
 */
export type SerialType = SerialPrimitive | typeof Serializable | string;

/**
 * Checks if a value is a valid serial type.
 * @param arg The value to check.
 * @returns True if the value is a serial type, otherwise false.
 */
export function isSerialType(arg: unknown): arg is SerialType {
	return isSerialPrimitive(arg) || isSerializeable(arg) || arg === 'string';
}

/**
 * Defines the serialized type information for a value.
 */
export interface SerialDef {
	/**
	 * The type of the value.
	 */
	type: SerialType;

	/**
	 * The maximum length of the array, if it is an array. Undefined for non-arrays
	 */
	length?: number;
}

/**
 * Checks if a value is a valid serial type definition.
 * @param arg The value to check.
 * @returns True if the value is a serial type definition, otherwise false.
 */
export function isSerialDef(arg: unknown): arg is SerialDef {
	if (typeof arg != 'object') {
		return false;
	}
	return 'type' in arg && isSerialType(arg.type);
}

/**
 * Represents a mapping of string keys to serial type definitions.
 */
export type SerialMap = Map<string, SerialDef>;

/**
 * Checks if a value is a valid serial type map.
 * @param arg The value to check.
 * @returns True if the value is a serial type map, otherwise false.
 */
export function isSerialMap(arg: unknown): arg is SerialMap {
	if (!(arg instanceof Map)) {
		return false;
	}

	return [...arg].every(([key, value]) => typeof key == 'string' && isSerialDef(value));
}

/**
 * Represents a serializable class.
 */
export declare class Serializable {
	['constructor']: typeof Serializable;

	/**
	 * Serializes the object to an ArrayBuffer.
	 * @returns The serialized data as a Uint8Array (for convenience).
	 */
	serialize(): Uint8Array;

	/**
	 * Deserializes an ArrayBuffer and populates the current instance with the deserialized data.
	 * @param data The ArrayBuffer containing serialized data.
	 * @returns The deserialized instance.
	 */
	deserialize(data: ArrayBuffer): this;

	/**
	 * @internal
	 * A static property that defines the serialized structure of the class.
	 */
	static __serial__: SerialMap;

	/**
	 * Deserializes an ArrayBuffer into an instance of the class.
	 * @param data The ArrayBuffer containing serialized data.
	 * @param instance An optional instance to populate with the deserialized data.
	 * @returns The deserialized instance.
	 */
	static Deserialize<S extends Serializable>(this: typeof Serializable, data: ArrayBuffer, instance?: S): S;
}

/**
 * Represents a serial static type, which is a serializable class type.
 *
 * Only use until https://github.com/Microsoft/TypeScript/issues/4881 is resolved.
 */
export type SerialStatic<T> = T & typeof Serializable;

/**
 * Represents a serial type, which is a serializable class instance.
 *
 * Only use until https://github.com/Microsoft/TypeScript/issues/4881 is resolved.
 */
export type Serial<T> = T & Serializable;

/**
 * Checks if a value is a serializable instance.
 * @param arg The value to check.
 * @returns True if the value is serializable, otherwise false.
 */
export function isSerializeable(arg: unknown): arg is Serializable {
	if (typeof arg != 'object' && typeof arg != 'function') {
		return false;
	}
	return isSerializeableStatic(arg.constructor);
}

/**
 * Checks if a value is a serializable class (or constructor function).
 * @param arg The value to check.
 * @returns True if the value is a serializable class, otherwise false.
 */
export function isSerializeableStatic(arg: unknown): arg is typeof Serializable {
	if (typeof arg != 'object' && typeof arg != 'function') {
		return false;
	}
	return '__serial__' in arg && isSerialMap(arg.__serial__);
}

/**
 * Returns the size of a serializable value in bytes
 * @param val the serializable value
 * @returns the size in bytes
 */
export function sizeof<S extends SerialDef | SerialType | Serializable>(val: S): number {
	let size = 0;
	const serialMap: SerialMap | [unknown, SerialDef][] = isSerializeable(val)
		? val.constructor.__serial__
		: isSerializeableStatic(val)
		? val.__serial__
		: [[null, isSerialDef(val) ? val : { type: val }]];
	for (const [, { type, length }] of serialMap) {
		let _size = 0;
		if (isSerialPrimitive(type)) {
			switch (type) {
				case 'Int8':
				case 'Uint8':
					_size = 1;
					break;
				case 'Int16':
				case 'Uint16':
					_size = 2;
					break;
				case 'Int32':
				case 'Uint32':
				case 'Float32':
					_size = 4;
					break;
				case 'BigInt64':
				case 'BigUint64':
				case 'Float64':
					_size = 8;
					break;
				default:
					throw new TypeError(`"${type}" is not a valid primitive type.`);
			}
		} else if (isSerializeable(type) || isSerializeableStatic(type)) {
			_size = sizeof(type);
		} else if (type == 'string') {
			_size = 1;
		} else {
			throw new TypeError(`"${typeof type == 'string' ? type : (type as object)?.constructor?.name}" is not a valid type`);
		}
		size += _size * (length ?? 1);
	}
	return size;
}

/**
 * Represents options for configuring a serializable class.
 */
export interface SerialClassOptions {
	/**
	 * Whether to use little-endian byte order for serialization.
	 */
	littleEndian: boolean;
}

/**
 * Default options for serializable classes.
 */
const defaultOptions: SerialClassOptions = {
	littleEndian: true,
};

/**
 * Decorator factory function for configuring a serializable class.
 * @param options The options to configure the class.
 * @returns A decorator function.
 *
 * This does not need to be used if `@serialMember` is used in the class (the default options will be used).
 */
export function serialClass(options: Partial<SerialClassOptions> = {}) {
	return function _decorateSerialClass(target) {
		const __serial__ = target.__serial__ || new Map();
		Object.assign(__serial__, defaultOptions, options);
		Object.assign(target, {
			__serial__,
			Deserialize,
		});
		Object.assign(target.prototype, {
			serialize,
			deserialize,
		});
	};
}

/**
 * Decorator factory function for configuring serializable class members.
 * @param type The serial type of the member.
 * @param length The length of the member if it's an array.
 * @returns A decorator function.
 */
export function serialMember(); // classes can be infered
export function serialMember(type: SerialType); // most members
export function serialMember(type: SerialType, length: number); // array members
export function serialMember(type?: SerialType, length?: number) {
	return function _decorateSerialMember(_target, property: string) {
		const target = _target as Serializable;
		if (!isSerializeable(target)) {
			serialClass(defaultOptions)(_target.constructor);
		}

		const value = target[property];
		if (!isSerialType(type)) {
			if (!isSerializeable(value)) {
				throw new TypeError(`"${property}" on ${target.constructor.name} is not serializable`);
			}

			type = value.constructor;
		}
		const def: SerialDef = { type };
		if (length) {
			def.length = length;
		}
		target.constructor.__serial__.set(property, def);
	};
}

export { serialMember as serial, serialMember as serialize };

/**
 * Serializes the current instance to a ArrayBuffer.
 * @returns The serialized data as a Uint8Array (for convenience).
 */
function serialize(this: Serializable): Uint8Array {
	const data = new Uint8Array(sizeof(this));
	const view = new DataView(data.buffer);
	let offset = 0;
	for (const [key, def] of this.constructor.__serial__) {
		const size = sizeof(def),
			errorPrefix = `Can not serialize "${key}" in ${this.constructor.name}: `,
			{ type, length } = def;
		let value = this[key];

		if (length === 0) {
			throw new Error(errorPrefix + '0-length arrays are not yet supported');
		}

		if (!isSerialType(type)) {
			throw new TypeError(errorPrefix + 'Invalid type');
		}

		if (type === 'string' && typeof value != 'string') {
			throw new TypeError(errorPrefix + 'Value is not a string');
		}

		if (length && !Array.isArray(value) && type !== 'string') {
			throw new TypeError(errorPrefix + 'Value is not an array');
		}

		if (!length && isSerialPrimitive(type) && typeof value !== serialPrimitiveValue(type)) {
			throw new TypeError(errorPrefix + 'Value is not a ' + serialPrimitiveValue(type));
		}

		if (typeof value == 'string') {
			value = [...value];
		}

		if (length) {
			const arrayData: number[] = value
				.flatMap(el => {
					switch (typeof el) {
						case 'string':
							return el.charCodeAt(0);
						case 'bigint':
						case 'number':
							return el;
						case 'boolean':
							return el ? 1 : 0;
						case 'undefined':
							return 0;
						case 'object':
							if (!isSerializeable(el)) {
								throw new TypeError(errorPrefix + 'Element is not serializeable');
							}

							return el.serialize();
						default:
							throw new TypeError(errorPrefix + 'Invalid element type');
					}
				})
				.slice(0, size);
			if (type == 'Float32' || type == 'Float64') {
				for (let i = 0; i < length; i++) {
					view['set' + type](offset + i * (size / length), arrayData[i]);
				}
			} else {
				data.set(arrayData, offset);
			}
		} else if (isSerialPrimitive(type)) {
			view['set' + type](offset, value);
		} else if (isSerializeableStatic(type)) {
			const serialized = type.prototype.serialize.call(value);
			data.set(serialized, offset);
		} else {
			throw new TypeError(errorPrefix + 'Invalid type');
		}

		offset += size;
	}

	return data;
}

/**
 * Deserializes an ArrayBuffer into an instance of the class.
 * @param data The ArrayBuffer containing serialized data.
 * @param instance An optional instance to populate with the deserialized data.
 * @returns The deserialized instance.
 */
function Deserialize(this: typeof Serializable, data: ArrayBuffer | ArrayBufferView, instance: Serializable = new this()): Serializable {
	const buffer = 'buffer' in data ? data.buffer : data;
	const view = new DataView(buffer);
	let offset = 0;
	for (const [key, def] of this.__serial__) {
		const size = sizeof(def),
			errorPrefix = `Can not deserialize "${key}" in ${this.name}: `,
			{ type, length } = def;

		if (length === 0) {
			throw new Error(errorPrefix + '0-length arrays are not yet supported');
		}

		if (!isSerialType(type)) {
			throw new TypeError(errorPrefix + 'Invalid type');
		}

		if (length) {
			const arraybuffer = buffer.slice(offset, offset + size);
			if (isSerialPrimitive(type)) {
				instance[key] ||= [];
				for (let i = 0; i < length; i++) {
					instance[key][i] = view['get' + type](offset + i * (size / length));
				}
			} else if (type === 'string') {
				const charArray: number[] = [...new Uint8Array(arraybuffer)];
				const lastChar = charArray.reduce((index, char, i) => (char == 0 ? index : i), 0) + 1;
				instance[key] = charArray
					.slice(0, lastChar || charArray.length)
					.map(char => String.fromCharCode(char))
					.join('');
			}
		} else if (isSerialPrimitive(type)) {
			instance[key] = view['get' + type](offset);
		} else if (isSerializeableStatic(type)) {
			instance[key] = type.Deserialize(buffer.slice(offset, offset + size));
		} else {
			throw new TypeError(errorPrefix + 'Invalid type');
		}

		offset += size;
	}
	return instance;
}

/**
 * Deserializes an ArrayBuffer into the current instance.
 * @param data The ArrayBuffer containing serialized data.
 * @returns The deserialized instance.
 */
function deserialize<S extends Serializable>(this: S, data: ArrayBuffer): S {
	return this.constructor.Deserialize<S>(data, this);
}
