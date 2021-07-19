/**
 * @jest-environment jsdom
 */
import { JSDOM } from "jsdom"
import {
  getNlsConfiguration,
  nlsConfigElementId,
  getConfigurationForLoader,
  setBodyBackgroundToThemeBackgroundColor,
  _createScriptURL,
  main,
  createBundlePath,
} from "../../../../src/browser/pages/vscode"

describe("vscode", () => {
  describe("getNlsConfiguration", () => {
    beforeEach(() => {
      const { window } = new JSDOM()
      global.document = window.document
    })

    afterEach(() => {
      global.window = undefined as unknown as Window & typeof globalThis
      global.document = undefined as unknown as Document & typeof globalThis
    })

    it("should throw an error if no nlsConfigElement", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not parse NLS configuration. Could not find nlsConfigElement with id: ${nlsConfigElementId}`

      expect(() => {
        getNlsConfiguration(document, "")
      }).toThrowError(errorMessage)
    })
    it("should throw an error if no nlsConfig", () => {
      const mockElement = document.createElement("div")
      mockElement.setAttribute("id", nlsConfigElementId)
      document.body.appendChild(mockElement)

      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not parse NLS configuration. Found nlsConfigElement but missing data-settings attribute.`

      expect(() => {
        getNlsConfiguration(document, "")
      }).toThrowError(errorMessage)

      document.body.removeChild(mockElement)
    })
    it("should return the correct configuration", () => {
      const mockElement = document.createElement("div")
      const dataSettings = {
        first: "Jane",
        last: "Doe",
      }

      mockElement.setAttribute("id", nlsConfigElementId)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      document.body.appendChild(mockElement)
      const actual = getNlsConfiguration(global.document, "")

      expect(actual).toStrictEqual(dataSettings)

      document.body.removeChild(mockElement)
    })
    it("should return have loadBundle property if _resolvedLangaugePackCoreLocation", () => {
      const mockElement = document.createElement("div")
      const dataSettings = {
        locale: "en",
        availableLanguages: ["en", "de"],
        _resolvedLanguagePackCoreLocation: "./",
      }

      mockElement.setAttribute("id", nlsConfigElementId)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      document.body.appendChild(mockElement)
      const nlsConfig = getNlsConfiguration(global.document, "")

      expect(nlsConfig._resolvedLanguagePackCoreLocation).not.toBe(undefined)
      expect(nlsConfig.loadBundle).not.toBe(undefined)

      document.body.removeChild(mockElement)
    })
  })
  describe("createBundlePath", () => {
    it("should return the correct path", () => {
      const _resolvedLangaugePackCoreLocation = "./languages"
      const bundle = "/bundle.js"
      const expected = "./languages/!bundle.js.nls.json"
      const actual = createBundlePath(_resolvedLangaugePackCoreLocation, bundle)
      expect(actual).toBe(expected)
    })
  })
  describe("setBodyBackgroundToThemeBackgroundColor", () => {
    beforeEach(() => {
      // We need to set the url in the JSDOM constructor
      // to prevent this error "SecurityError: localStorage is not available for opaque origins"
      // See: https://github.com/jsdom/jsdom/issues/2304#issuecomment-622314949
      const { window } = new JSDOM("", { url: "http://localhost" })
      global.document = window.document
      global.localStorage = window.localStorage
    })
    it("should return null", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(setBodyBackgroundToThemeBackgroundColor(document, localStorage)).toBeNull()

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if it can't find colorThemeData in localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not find colorThemeData in localStorage.`

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)
    })
    it("should throw an error if there is an error parsing colorThemeData from localStorage", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. Could not parse colorThemeData from localStorage.`

      localStorage.setItem(
        "colorThemeData",
        '{"id":"vs-dark max-SS-Cyberpunk-themes-cyberpunk-umbra-color-theme-json","label":"Activate UMBRA protocol","settingsId":"Activate "errorForeground":"#ff3270","foreground":"#ffffff","sideBarTitle.foreground":"#bbbbbb"},"watch\\":::false}',
      )

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if there is no colorMap property", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData is missing colorMap.`

      const test = {
        id: "hey-joe",
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should throw an error if there is no editor.background color", () => {
      const errorMsgPrefix = "[vscode]"
      const errorMessage = `${errorMsgPrefix} Could not set body background to theme background color. colorThemeData.colorMap["editor.background"] is undefined.`

      const test = {
        id: "hey-joe",
        colorMap: {
          editor: "#fff",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      expect(() => {
        setBodyBackgroundToThemeBackgroundColor(document, localStorage)
      }).toThrowError(errorMessage)

      localStorage.removeItem("colorThemeData")
    })
    it("should set the body background to the editor background color", () => {
      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))

      setBodyBackgroundToThemeBackgroundColor(document, localStorage)

      // When the body.style.backgroundColor is set using hex
      // it is converted to rgb
      // which is why we use that in the assertion
      expect(document.body.style.backgroundColor).toBe("rgb(255, 50, 112)")

      localStorage.removeItem("colorThemeData")
    })
  })
  describe("getConfigurationForLoader", () => {
    beforeEach(() => {
      const { window } = new JSDOM()
      global.document = window.document
    })
    afterEach(() => {
      global.window = undefined as unknown as Window & typeof globalThis
      global.document = undefined as unknown as Document & typeof globalThis
    })
    it("should return a loader object (with undefined trustedTypesPolicy)", () => {
      const options = {
        base: "/",
        csStaticBase: "/",
        logLevel: 1,
      }
      const nlsConfig = {
        first: "Jane",
        last: "Doe",
        locale: "en",
        availableLanguages: {},
      }
      const loader = getConfigurationForLoader({
        options,
        origin: "localhost",
        nlsConfig: nlsConfig,
        _window: global.window,
      })

      expect(loader).toStrictEqual({
        baseUrl: "localhost//lib/vscode/out",
        paths: {
          "iconv-lite-umd": "../node_modules/iconv-lite-umd/lib/iconv-lite-umd.js",
          jschardet: "../node_modules/jschardet/dist/jschardet.min.js",
          "tas-client-umd": "../node_modules/tas-client-umd/lib/tas-client-umd.js",
          "vscode-oniguruma": "../node_modules/vscode-oniguruma/release/main",
          "vscode-textmate": "../node_modules/vscode-textmate/release/main",
          xterm: "../node_modules/xterm/lib/xterm.js",
          "xterm-addon-search": "../node_modules/xterm-addon-search/lib/xterm-addon-search.js",
          "xterm-addon-unicode11": "../node_modules/xterm-addon-unicode11/lib/xterm-addon-unicode11.js",
          "xterm-addon-webgl": "../node_modules/xterm-addon-webgl/lib/xterm-addon-webgl.js",
        },
        recordStats: true,

        // TODO@jsjoeio address trustedTypesPolicy part
        // might need to look up types
        // and find a way to test the function
        // maybe extract function into function
        // and test manually
        trustedTypesPolicy: undefined,
        "vs/nls": {
          availableLanguages: {},
          first: "Jane",
          last: "Doe",
          locale: "en",
        },
      })
    })
    it("should return a loader object with trustedTypesPolicy", () => {
      interface PolicyOptions {
        createScriptUrl: (url: string) => string
      }

      function mockCreatePolicy(policyName: string, options: PolicyOptions) {
        return {
          name: policyName,
          ...options,
        }
      }

      const mockFn = jest.fn(mockCreatePolicy)

      // @ts-expect-error we are adding a custom property to window
      global.window.trustedTypes = {
        createPolicy: mockFn,
      }

      const options = {
        base: "/",
        csStaticBase: "/",
        logLevel: 1,
      }
      const nlsConfig = {
        first: "Jane",
        last: "Doe",
        locale: "en",
        availableLanguages: {},
      }
      const loader = getConfigurationForLoader({
        options,
        origin: "localhost",
        nlsConfig: nlsConfig,
        _window: global.window,
      })

      expect(loader.trustedTypesPolicy).not.toBe(undefined)
      expect(loader.trustedTypesPolicy.name).toBe("amdLoader")
    })
  })
  describe("_createScriptURL", () => {
    it("should return the correct url", () => {
      const url = _createScriptURL("localhost/foo/bar.js", "localhost")

      expect(url).toBe("localhost/foo/bar.js")
    })
    it("should throw if the value doesn't start with the origin", () => {
      expect(() => {
        _createScriptURL("localhost/foo/bar.js", "coder.com")
      }).toThrow("Invalid script url: localhost/foo/bar.js")
    })
  })
  describe("main", () => {
    beforeEach(() => {
      // We need to set the url in the JSDOM constructor
      // to prevent this error "SecurityError: localStorage is not available for opaque origins"
      // See: https://github.com/jsdom/jsdom/issues/2304#issuecomment-62231494
      const { window } = new JSDOM("", { url: "http://localhost" })
      global.document = window.document
      global.localStorage = window.localStorage

      const mockElement = document.createElement("div")
      const dataSettings = {
        first: "Jane",
        last: "Doe",
      }

      mockElement.setAttribute("id", nlsConfigElementId)
      mockElement.setAttribute("data-settings", JSON.stringify(dataSettings))
      document.body.appendChild(mockElement)

      const test = {
        colorMap: {
          [`editor.background`]: "#ff3270",
        },
      }
      localStorage.setItem("colorThemeData", JSON.stringify(test))
    })
    afterEach(() => {
      localStorage.removeItem("colorThemeData")
    })
    it("should throw if document is missing", () => {
      expect(() => {
        main(undefined, window, localStorage)
      }).toThrow("[vscode] Could not run code-server vscode logic. document is undefined.")
    })
    it("should throw if window is missing", () => {
      expect(() => {
        main(document, undefined, localStorage)
      }).toThrow("[vscode] Could not run code-server vscode logic. window is undefined.")
    })
    it("should throw if localStorage is missing", () => {
      expect(() => {
        main(document, window, undefined)
      }).toThrow("[vscode] Could not run code-server vscode logic. localStorage is undefined.")
    })
    it("should add loader to self.require", () => {
      main(document, window, localStorage)

      expect(Object.prototype.hasOwnProperty.call(self, "require")).toBe(true)
    })
    it("should not throw in browser context", () => {
      // Assuming we call it in a normal browser context
      // where everything is defined
      expect(() => {
        main(global.document, global.window, global.localStorage)
      }).not.toThrow()
    })
  })
})
