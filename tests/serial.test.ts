import { isSerialPrimitive, isSerialDef, sizeof, Serial, SerialStatic, serialMember } from '../src/serial';

describe('isSerialPrimitive', () => {
	it('should return true for valid serial primitive types', () => {
		expect(isSerialPrimitive('Int8')).toBe(true);
		expect(isSerialPrimitive('Uint8')).toBe(true);
		expect(isSerialPrimitive('Int16')).toBe(true);
		expect(isSerialPrimitive('Uint16')).toBe(true);
		expect(isSerialPrimitive('Int32')).toBe(true);
		expect(isSerialPrimitive('Uint32')).toBe(true);
		expect(isSerialPrimitive('BigInt64')).toBe(true);
		expect(isSerialPrimitive('BigUint64')).toBe(true);
		expect(isSerialPrimitive('Float32')).toBe(true);
		expect(isSerialPrimitive('Float64')).toBe(true);
	});

	it('should return false for invalid types', () => {
		expect(isSerialPrimitive('InvalidType')).toBe(false);
		expect(isSerialPrimitive(undefined)).toBe(false);
	});
});

describe('isSerialDef', () => {
	it('should return true for valid serial definitions', () => {
		const validDef = { type: 'Int32' };
		expect(isSerialDef(validDef)).toBe(true);
	});

	it('should return false for invalid definitions', () => {
		const invalidDef = { type: 'InvalidType' };
		expect(isSerialDef(invalidDef)).toBe(false);
	});
});

describe('sizeof, serialize, deserialize', () => {
	class _Test {
		@serialMember('Int16')
		prop1: number;

		@serialMember('Float32', 2)
		prop2: number[];

		@serialMember('string', 5)
		prop3: string;
	}
	const Test = _Test as SerialStatic<typeof _Test>;
	const instance = new Test() as Serial<_Test>;
	const expectedSerializedData = new Uint8Array([
		0,
		42, // prop1 = 42 (Int16)
		0x40,
		0x48,
		0xf5,
		0xc3, // prop2[0] = 3.14 (Float32)
		0x40,
		0x2d,
		0x70,
		0xa4, // prop2[1] = 2.71 (Float32)
		't'.charCodeAt(0),
		'e'.charCodeAt(0),
		's'.charCodeAt(0),
		't'.charCodeAt(0),
		0, //prop3 = 'test\0'
	]);
	it('sizeof should calculate the size correctly', () => {
		expect(sizeof(instance)).toBe(15);
		expect(sizeof(Test)).toBe(15);
	});
	it('should serialize correctly', () => {
		instance.prop1 = 42;
		instance.prop2 = [3.14, 2.71];
		instance.prop3 = 'test';
		expect(instance.serialize()).toEqual(expectedSerializedData);
	});
	it('should deserialize correctly', () => {
		const deserialized = Test.Deserialize<Serial<_Test>>(expectedSerializedData.buffer);
		expect(deserialized instanceof Test).toBe(true);
		expect(deserialized.prop1).toBe(42);
		expect(deserialized.prop2).toBeDefined();
		expect(deserialized.prop2[0]).toBeCloseTo(3.14);
		expect(deserialized.prop2[1]).toBeCloseTo(2.71);
		expect(deserialized.prop3).toBe('test');
	});
});

describe('serialClass', () => {
	it('should apply class decorators correctly', () => {
		class _TestClass {
			@serialMember('Int32')
			prop1: number;
		}

		const TestClass = _TestClass as SerialStatic<typeof _TestClass>;

		const instance = new TestClass();
		const __serial__ = instance.constructor!.__serial__;
		expect(__serial__).toBeDefined();
		const propDef = __serial__.get('prop1');
		expect(propDef).toBeDefined();
		expect(isSerialDef(propDef)).toBe(true);
		expect(propDef!.type).toBe('Int32');
		expect(sizeof(propDef)).toBe(4);
	});
});
