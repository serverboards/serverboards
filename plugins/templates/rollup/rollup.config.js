import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/[component-type].js',
  format: 'umd',
  plugins: [
    babel(),
    nodeResolve({})
   ],
  dest: 'static/[component-type].js',
};
