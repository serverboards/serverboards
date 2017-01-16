import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/editor.js',
  format: 'umd',
  plugins: [
    babel(),
    nodeResolve({})
   ],
  dest: 'static/editor.js',
};
