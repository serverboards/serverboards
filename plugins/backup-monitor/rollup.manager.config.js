import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/manager.js',
  format: 'cjs',
  plugins: [ babel() ],
  dest: 'static/manager.js',
  sourceMap: true
};
