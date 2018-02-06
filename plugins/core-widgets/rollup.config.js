import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

const widgets = [
  "mini5", "clock", "mini2", "markdown", "table",
  "mini3bars"
]

const configs = widgets.map( w => ({
    input: `src/${w}.js`,
    plugins: [
      babel(),
      nodeResolve({}),
      uglify()
     ],
    output: {
      format: 'umd',
      file: `static/${w}.js`
    },
}))

export default configs
