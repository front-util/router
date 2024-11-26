const enum TestEnum {
    VAL = 0,
    VAL2
}

export const testUtil = (parameter: number) => {
    return parameter + TestEnum.VAL + TestEnum.VAL2;
};