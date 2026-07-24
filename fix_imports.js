const fs = require('fs');
const path = require('path');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Find any occurrence of com.example.zhanfinancebackend.something
    const prefixRegex = /\b(com\.example\.zhanfinancebackend\.[\w\.]+)\b/g;

    const lines = content.split('\n');
    let modified = false;
    let newLines = [];
    let importsToAdd = new Set();
    
    for (let line of lines) {
        if (line.trim().startsWith('import ') || line.trim().startsWith('package ')) {
            newLines.push(line);
            continue;
        }

        let lineCopy = line;
        let match;
        let matches = [];
        while ((match = prefixRegex.exec(lineCopy)) !== null) {
            matches.push(match[1]);
        }

        // Sort by length descending to replace longer FQNs first if any overlap
        matches.sort((a, b) => b.length - a.length);

        for (let fqn of matches) {
            // Split FQN by dot
            let parts = fqn.split('.');
            let packageParts = [];
            let classParts = [];
            let foundClass = false;

            for (let part of parts) {
                if (!foundClass && /^[A-Z]/.test(part)) {
                    foundClass = true;
                }
                if (foundClass) {
                    classParts.push(part);
                } else {
                    packageParts.push(part);
                }
            }

            if (classParts.length > 0) {
                let classFqn = packageParts.join('.') + '.' + classParts[0];
                let replacement = classParts.join('.');
                
                importsToAdd.add(classFqn);
                
                // Replace this specific fqn occurrence
                lineCopy = lineCopy.split(fqn).join(replacement);
                modified = true;
            }
        }
        
        newLines.push(lineCopy);
    }

    if (!modified) {
        return false;
    }

    // Extract existing imports
    const existingImports = new Set();
    const existingImportRegex = /^import\s+([\w\.]+);/gm;
    let importMatch;
    while ((importMatch = existingImportRegex.exec(content)) !== null) {
        existingImports.add(importMatch[1]);
    }

    const finalImports = [...importsToAdd].filter(imp => !existingImports.has(imp));

    if (finalImports.length === 0) {
        // Just replaced inline usage, no new imports
        if (content !== newLines.join('\n')) {
             fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
             return true;
        }
        return false;
    }

    // Check for class name clashes
    const allClassNames = [...existingImports, ...finalImports].map(imp => imp.split('.').pop());
    const uniqueClassNames = new Set(allClassNames);
    if (allClassNames.length !== uniqueClassNames.size) {
        console.log(`Skipping ${filepath} due to class name clash in imports!`);
        return false;
    }

    // Find insertion index
    let insertIdx = 0;
    let lastImportIdx = -1;
    let packageIdx = -1;

    for (let i = 0; i < newLines.length; i++) {
        if (newLines[i].startsWith('package ')) packageIdx = i;
        else if (newLines[i].startsWith('import ')) lastImportIdx = i;
    }

    if (lastImportIdx !== -1) insertIdx = lastImportIdx + 1;
    else if (packageIdx !== -1) insertIdx = packageIdx + 1;
    else insertIdx = 0;

    finalImports.sort();
    const importStrings = finalImports.map(imp => `import ${imp};`);
    
    if (insertIdx > 0 && newLines[insertIdx - 1].trim() !== '') {
        importStrings.unshift('');
    }

    newLines.splice(insertIdx, 0, ...importStrings);

    fs.writeFileSync(filepath, newLines.join('\n'), 'utf8');
    return true;
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function main() {
    const rootDir = path.join(__dirname, 'zhan-finance-backend', 'src', 'main', 'java', 'com', 'example', 'zhanfinancebackend');
    let modifiedCount = 0;
    
    walkDir(rootDir, function(filePath) {
        if (filePath.endsWith('.java')) {
            if (processFile(filePath)) {
                console.log(`Updated ${filePath}`);
                modifiedCount++;
            }
        }
    });

    console.log(`Total files updated: ${modifiedCount}`);
}

main();
