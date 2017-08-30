import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/index.js',
  format: 'umd',
  plugins: [
    babel(),
    nodeResolve({})
   ],
  dest: 'static/node_list.js',
  sourceMap: 'inline'
};
