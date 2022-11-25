import app from ".";

const myapp = app()
const { render } = myapp

myapp.route("/", () => {
  return render(`
    <html>
    	<body>
        <button onClick={data.handleHello}>{data.textHello}</button>
      </body>
    </html>

    <script>
      function getServerSideProps(context) {
        return {
          data: {
            handleHello: () => {
              alert("hello")
            },
            textHello: "Hello"
          }
        }
      }
    </script>
  `)
})