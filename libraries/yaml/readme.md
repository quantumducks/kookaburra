# Toa Yaml

JavaScript parser and stringifier for YAML.

## yaml.load(path: string): object
Parse the data from a YAML file and convert it into JSON format.

## yaml.dump(input: object): string
Serializes object as a YAML document.

## yaml.parse(input: string): object
Parses string as single YAML document.

## yaml.split(path: string): object
Same as load(), but understands multi-document sources.

## yaml.save(file: string, data: object): object
Write the `data` to a `file` in YAML format.


# Additional YAML tags

## !import file.yaml
This tag loads content from an internal file and merges it with the current YAML.
