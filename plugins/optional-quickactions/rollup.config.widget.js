import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/widget.js',
  format: 'umd',
  plugins: [
    babel(),
    nodeResolve({})
   ],
  dest: 'static/widget.js',
};
