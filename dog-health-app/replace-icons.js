const fs = require('fs');
const p = require('path');
const dir = p.join(__dirname, 'app');

function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(f => {
    const fp = p.join(d, f.name);
    if (f.isDirectory()) {
      walk(fp);
    } else if (f.name.match(/\.tsx?$/)) {
      let c = fs.readFileSync(fp, 'utf8');
      if (c.includes("@expo/vector-icons")) {
        c = c.replace(
          "import { Ionicons } from '@expo/vector-icons';",
          "import Ionicons from 'react-native-vector-icons/Ionicons';"
        );
        fs.writeFileSync(fp, c);
        console.log('Updated:', fp);
      }
    }
  });
}

walk(dir);
console.log('Done.');
