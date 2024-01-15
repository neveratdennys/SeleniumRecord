# Translate from selenium pytest to functional webdriver


def extract_method():
    # Source
    with open('new-test.py', 'r') as source_file:
        source_content = source_file.readlines()

    # Extract
    extracted_code = ''.join(source_content[23:])

    return extracted_code


def manipulate_method(content):
    content = content.replace("self.", "")
    content = '\n'.join(line.lstrip() for line in content.split('\n'))
    return content


def insert_method(content):

    # Read content from headless.py template
    with open('template.py', 'r') as template_file:
        template_content = template_file.readlines()

    # Insert extracted code
    template_content.insert(16, content)  # zero-based index

    # Write back
    with open('playback.py', 'w') as modified_file:
        modified_file.writelines(template_content)


def main():

    extracted_code = extract_method()
    manipulated_code = manipulate_method(extracted_code)
    insert_method(manipulated_code)

if __name__ == "__main__":
    main()
