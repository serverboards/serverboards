import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/[component-type].js',
  plugins: [
    babel(),
    nodeResolve({}),
    uglify()
   ],
  output: {
    format: 'umd',
    file: 'static/[component-type].js'
  }
};
