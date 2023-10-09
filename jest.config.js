export default {
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	roots: ['<rootDir>/tests'],
	transform: {
		'^.+\\.(ts|tsx)$': ['ts-jest'],
	},
	testEnvironment: 'node',
};
