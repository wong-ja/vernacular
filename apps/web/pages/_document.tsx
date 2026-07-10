import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html className="dark" suppressHydrationWarning>
      <Head />
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vernacular-theme');if(t=='light'){document.documentElement.className=''}else if(!t&&matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.className=''}else{document.documentElement.className='dark'}}catch(e){}})()`,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
