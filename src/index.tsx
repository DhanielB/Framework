import http from "http"
import cherio from "cherio";
import loadsh from "loadsh";
import * as ts from "typescript";

let routes: { pathname: string, callback: Function }[] = []

const server = http.createServer((req, res) => {
  const pathname = req.url?.slice(req.url.lastIndexOf("/"))

  for(let route of routes) {
    if(route.pathname == pathname) {
      res.writeHead(200, { 'Content-Type': 'application/html' })
      res.end(route.callback())
    }
  }

  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(`CANNOT GET ${pathname}`)
})

function useProcess(preProcessedSyntax): { html: string; externCode: string } {
  let finalHtml = preProcessedSyntax
    .html()
    .replace(`<script>${preProcessedSyntax("script").html()}</script>`, "");
  let finalScript = preProcessedSyntax("script").html();

  return {
    html: finalHtml,
    externCode: finalScript,
  };
}

function useExtractor(syntax: string): { internalCode: string } {
  const preProcessedSyntax = cherio.load(syntax);
  const { html, externCode } = useProcess(preProcessedSyntax);

  let transpiledExternCode = ts.transpile(externCode);
  const { getServerSideProps } = eval(transpiledExternCode);

  let renderedHtml = html;

  const getServerSideData = getServerSideProps({});

  for (let dataIndex of renderedHtml.match(/{(.*?)}/) || []) {
    renderedHtml = renderedHtml.replace(
      dataIndex,
      loadsh.at(getServerSideData, dataIndex.replace("{", "").replace("}", ""))
    );
  }

  return {
    internalCode: renderedHtml,
  };
}

function render(syntax: string) {
  const { internalCode } = useExtractor(syntax);

  return internalCode;
}

function route(path, callback) {
  routes.push(path, callback);
}

export default function app() {
  return {
    route,
    render,
    listen: (port : number, callback = () => {}) => {
      server.listen(port)

      callback()
    },
    stop: server.close
  }
}
