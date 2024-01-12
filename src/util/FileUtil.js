class FileUtil {

    static readFile = (file) => new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            resolve(JSON.parse(e.target.result));
        };
        fileReader.readAsText(file);
    });

}

export { FileUtil };