function mapAndApply(fromObject, toObject, mapper) {
    for (const [inputKey, inputValue] of Object.entries(fromObject)) {
        const mapEntry = mapper.properties[inputKey];
        if (!mapEntry)
            if (!mapper.mapUndefined)
                continue;

        const destinationKey = mapEntry.key || inputKey;
        const conversionFunc = mapEntry.convert || ((val) => val);
        const onChange = mapEntry.onChange || (() => { });

        const convertedValue = conversionFunc(inputValue);

        const valuesAreEqual = Array.isArray(toObject[destinationKey]) && Array.isArray(convertedValue)
        ? arraysAreEqual(toObject[destinationKey], convertedValue)
        : toObject[destinationKey] === convertedValue;

        if (!valuesAreEqual) {
            debugger;
            toObject[destinationKey] = convertedValue;
            onChange();
        }
    }
}