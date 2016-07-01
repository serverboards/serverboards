# Manual modifications on semantic.css

Ther are some manual modifications on semantic.css to avoid loading external
resources, specifically, changed font loading to:

```css
@font-face {
 font-family: 'Lato';
 font-style: normal;
 font-weight: 400;
 src: local('Lato Regular'), local('Lato-Regular'), url(fonts/Lato-Regular.ttf) format('truetype');
}
@font-face {
 font-family: 'Lato';
 font-style: normal;
 font-weight: 700;
 src: local('Lato Bold'), local('Lato-Bold'), url(fonts/Lato-Bold.ttf) format('truetype');
}
@font-face {
 font-family: 'Lato';
 font-style: italic;
 font-weight: 400;
 src: local('Lato Italic'), local('Lato-Italic'), url(fonts/Lato-Italic.ttf) format('truetype');
}
@font-face {
 font-family: 'Lato';
 font-style: italic;
 font-weight: 700;
 src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(fonts/Lato-BoldItalic.ttf) format('truetype');
}
```

Later reminimified manually:

```sh
$ node_modules/.bin/minify --css < app/css/semantic.css  > app/css/semantic.min.css
```
