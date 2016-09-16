import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/watcher.js',
  format: 'cjs',
  plugins: [ babel() ],
  dest: 'static/watcher.js'
};
