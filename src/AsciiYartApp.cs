using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

[assembly: AssemblyTitle("AsciiYart")]
[assembly: AssemblyProduct("AsciiYart - Photo to ASCII Art Studio")]
[assembly: AssemblyDescription("Photo to ASCII Art Studio")]
[assembly: AssemblyCompany("thegraveyart")]
[assembly: AssemblyCopyright("Copyright © 2026 thegraveyart")]
[assembly: AssemblyTrademark("thegraveyart")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace AsciiYartDesktop
{
    internal static class Program
    {
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool SetDllDirectory(string lpPathName);

        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        public static string AppRuntimeDir;

        [STAThread]
        private static void Main()
        {
            try { SetProcessDPIAware(); } catch { }

            bool isScreenshot = false;
            foreach (string a in Environment.GetCommandLineArgs())
            {
                if (a.IndexOf("screenshot", StringComparison.OrdinalIgnoreCase) >= 0) { isScreenshot = true; break; }
            }

            // Ensure single instance: bring existing AsciiYart window to foreground (skip if screenshot)
            if (!isScreenshot)
            {
                bool createdNew;
                using (Mutex mutex = new Mutex(true, "AsciiYart_SingleInstance_Mutex_2026", out createdNew))
                {
                    if (!createdNew)
                    {
                        IntPtr existingHwnd = FindWindow(null, "AsciiYart");
                        if (existingHwnd != IntPtr.Zero)
                        {
                            ShowWindow(existingHwnd, 9); // SW_RESTORE
                            SetForegroundWindow(existingHwnd);
                            return;
                        }
                    }

                    InitAndRunStudio();
                }
            }
            else
            {
                InitAndRunStudio();
            }
        }

        private static void InitAndRunStudio()
        {
            AppRuntimeDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "AsciiYart",
                "Runtime"
            );
            Directory.CreateDirectory(AppRuntimeDir);

            ExtractNativeLoaderIfNeeded();
            SetDllDirectory(AppRuntimeDir);

            AppDomain.CurrentDomain.AssemblyResolve += OnResolveAssembly;
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += (s, e) =>
            {
                try { File.AppendAllText(Path.Combine(AppRuntimeDir, "startup.log"), "ThreadException: " + e.Exception + "\r\n"); } catch { }
            };
            AppDomain.CurrentDomain.UnhandledException += (s, e) =>
            {
                try { File.AppendAllText(Path.Combine(AppRuntimeDir, "startup.log"), "UnhandledException: " + e.ExceptionObject + "\r\n"); } catch { }
            };

            RunStudioWindow();
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void RunStudioWindow()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainStudioForm());
        }

        private static void ExtractNativeLoaderIfNeeded()
        {
            string loaderPath = Path.Combine(AppRuntimeDir, "WebView2Loader.dll");
            if (!File.Exists(loaderPath))
            {
                using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("WebView2Loader.dll"))
                {
                    if (s != null)
                    {
                        using (FileStream fs = new FileStream(loaderPath, FileMode.Create, FileAccess.Write))
                        {
                            s.CopyTo(fs);
                        }
                    }
                }
            }
        }

        private static Assembly OnResolveAssembly(object sender, ResolveEventArgs args)
        {
            string shortName = new AssemblyName(args.Name).Name + ".dll";
            using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream(shortName))
            {
                if (s == null) return null;
                byte[] data = new byte[s.Length];
                s.Read(data, 0, data.Length);
                return Assembly.Load(data);
            }
        }
    }

    internal sealed class EmbeddedStudioServer : IDisposable
    {
        private readonly TcpListener _listener;
        private readonly Thread _serverThread;
        private readonly string _baseDir;
        private volatile bool _running;
        public int Port { get; private set; }

        private static readonly Dictionary<string, string> ResourceMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "/", "AsciiYart.html" },
            { "/index.html", "AsciiYart.html" },
            { "/AsciiYart.html", "AsciiYart.html" },
            { "/css/styles.css", "styles.css" },
            { "/js/palettes.js", "palettes.js" },
            { "/js/exporters.js", "exporters.js" },
            { "/js/demo-photos.js", "demo-photos.js" },
            { "/js/ascii-engine.js", "ascii-engine.js" },
            { "/js/app.js", "app.js" }
        };

        public EmbeddedStudioServer()
        {
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _listener = new TcpListener(IPAddress.Loopback, 0);
            _listener.Start();
            Port = ((IPEndPoint)_listener.LocalEndpoint).Port;
            _running = true;

            _serverThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "AsciiYartHttpServer"
            };
            _serverThread.Start();
        }

        private void ListenLoop()
        {
            while (_running)
            {
                try
                {
                    TcpClient client = _listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private void HandleClient(object state)
        {
            using (TcpClient client = (TcpClient)state)
            using (NetworkStream stream = client.GetStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.UTF8, false, 1024, true))
            {
                try
                {
                    string requestLine = reader.ReadLine();
                    if (string.IsNullOrEmpty(requestLine)) return;

                    string[] parts = requestLine.Split(' ');
                    if (parts.Length < 2) return;

                    string rawUrl = parts[1];
                    int qIdx = rawUrl.IndexOf('?');
                    string urlPath = qIdx >= 0 ? rawUrl.Substring(0, qIdx) : rawUrl;
                    urlPath = Uri.UnescapeDataString(urlPath);
                    if (string.IsNullOrEmpty(urlPath)) urlPath = "/";

                    byte[] body = LoadAssetBytes(urlPath);
                    if (body == null)
                    {
                        byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found");
                        WriteResponse(stream, "404 Not Found", "text/plain; charset=utf-8", notFound);
                        return;
                    }

                    string mime = GetMimeType(urlPath);
                    WriteResponse(stream, "200 OK", mime, body);
                }
                catch { }
            }
        }

        private byte[] LoadAssetBytes(string urlPath)
        {
            string relPath = (urlPath == "/" ? "AsciiYart.html" : urlPath.TrimStart('/')).Replace('/', Path.DirectorySeparatorChar);
            string diskPath = Path.Combine(_baseDir, relPath);
            if (File.Exists(diskPath))
            {
                try { return File.ReadAllBytes(diskPath); } catch { }
            }

            string resName;
            if (ResourceMap.TryGetValue(urlPath, out resName))
            {
                using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream(resName))
                {
                    if (s != null)
                    {
                        byte[] buf = new byte[s.Length];
                        s.Read(buf, 0, buf.Length);
                        return buf;
                    }
                }
            }
            return null;
        }

        private static string GetMimeType(string path)
        {
            if (path.EndsWith(".css", StringComparison.OrdinalIgnoreCase)) return "text/css; charset=utf-8";
            if (path.EndsWith(".js", StringComparison.OrdinalIgnoreCase)) return "application/javascript; charset=utf-8";
            if (path.EndsWith(".png", StringComparison.OrdinalIgnoreCase)) return "image/png";
            if (path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) || path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)) return "image/jpeg";
            if (path.EndsWith(".svg", StringComparison.OrdinalIgnoreCase)) return "image/svg+xml";
            return "text/html; charset=utf-8";
        }

        private static void WriteResponse(NetworkStream stream, string status, string contentType, byte[] body)
        {
            string headers =
                "HTTP/1.1 " + status + "\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Cache-Control: no-store\r\n" +
                "Connection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Write(body, 0, body.Length);
            stream.Flush();
        }

        public void Dispose()
        {
            _running = false;
            try { _listener.Stop(); } catch { }
        }
    }

    internal sealed class MainStudioForm : Form
    {
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private readonly EmbeddedStudioServer _server;
        private WebView2 _webView;
        private string _activeUserDataDir;

        public MainStudioForm()
        {
            Text = "AsciiYart";
            Width = 1420;
            Height = 880;
            MinimumSize = new Size(980, 640);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(11, 11, 13);
            ForeColor = Color.FromArgb(228, 229, 235);
            string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "AsciiYart.ico");
            if (File.Exists(icoPath))
            {
                try { Icon = new Icon(icoPath); } catch { Icon = CreateStudioIcon(); }
            }
            else
            {
                Icon = CreateStudioIcon();
            }

            ApplyDarkTitleBar();

            _server = new EmbeddedStudioServer();
            Shown += (s, e) => InitializeWebViewAsync();
        }

        private void ApplyDarkTitleBar()
        {
            try
            {
                int useDark = 1;
                if (DwmSetWindowAttribute(Handle, 20, ref useDark, sizeof(int)) != 0)
                {
                    DwmSetWindowAttribute(Handle, 19, ref useDark, sizeof(int));
                }
            }
            catch { }
        }

        private static Icon CreateStudioIcon()
        {
            using (Bitmap bmp = new Bitmap(64, 64))
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.Clear(Color.Transparent);
                using (SolidBrush bg = new SolidBrush(Color.FromArgb(16, 18, 24)))
                using (Pen border = new Pen(Color.FromArgb(107, 158, 255), 3f))
                {
                    g.FillRectangle(bg, 4, 4, 56, 56);
                    g.DrawRectangle(border, 4, 4, 56, 56);
                }
                using (Font f = new Font("Consolas", 24f, FontStyle.Bold, GraphicsUnit.Pixel))
                using (SolidBrush fg = new SolidBrush(Color.FromArgb(107, 158, 255)))
                {
                    g.DrawString("A#", f, fg, new PointF(11f, 16f));
                }
                return Icon.FromHandle(bmp.GetHicon());
            }
        }

        private static string DetectWebView2RuntimeFolder()
        {
            string[] paths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\EdgeWebView\Application\156.0.4314.42",
                @"C:\Program Files\Microsoft\EdgeWebView\Application\156.0.4314.42"
            };
            foreach (string p in paths)
            {
                if (File.Exists(Path.Combine(p, "msedgewebview2.exe"))) return p;
            }
            return null;
        }

        private async void InitializeWebViewAsync()
        {
            string url = "http://127.0.0.1:" + _server.Port + "/AsciiYart.html?desktop=1";
            try
            {
                _webView = new WebView2
                {
                    Dock = DockStyle.Fill,
                    DefaultBackgroundColor = Color.FromArgb(11, 11, 13)
                };
                Controls.Add(_webView);

                // Try process-isolated UserData folder in LocalAppData
                _activeUserDataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "AsciiYart",
                    "WebView2_" + Process.GetCurrentProcess().Id
                );
                Directory.CreateDirectory(_activeUserDataDir);

                CoreWebView2Environment env = null;
                string runtimeFolder = DetectWebView2RuntimeFolder();

                bool needFallback = false;
                try
                {
                    env = await CoreWebView2Environment.CreateAsync(runtimeFolder, _activeUserDataDir);
                }
                catch (COMException comEx)
                {
                    if (comEx.ErrorCode == unchecked((int)0x800700AA))
                    {
                        needFallback = true;
                    }
                    else
                    {
                        throw;
                    }
                }

                if (needFallback)
                {
                    _activeUserDataDir = Path.Combine(Path.GetTempPath(), "AsciiYart_WV2_" + Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(_activeUserDataDir);
                    env = await CoreWebView2Environment.CreateAsync(runtimeFolder, _activeUserDataDir);
                }

                await _webView.EnsureCoreWebView2Async(env);

                _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                _webView.CoreWebView2.NavigationCompleted += async (s, args) =>
                {
                    try { File.AppendAllText(Path.Combine(Program.AppRuntimeDir, "startup.log"), "NavigationCompleted: IsSuccess=" + args.IsSuccess + "\r\n"); } catch { }

                    string[] cmdArgs = Environment.GetCommandLineArgs();
                    string screenshotArg = null;
                    string demoArg = "Apollo";
                    bool showDrawer = false;
                    for (int i = 0; i < cmdArgs.Length; i++)
                    {
                        if (cmdArgs[i].StartsWith("--screenshot=", StringComparison.OrdinalIgnoreCase))
                        {
                            screenshotArg = cmdArgs[i].Substring("--screenshot=".Length).Trim('\"');
                        }
                        else if (cmdArgs[i].Equals("--screenshot", StringComparison.OrdinalIgnoreCase) && i + 1 < cmdArgs.Length)
                        {
                            screenshotArg = cmdArgs[i + 1].Trim('\"');
                        }
                        else if (cmdArgs[i].StartsWith("--demo=", StringComparison.OrdinalIgnoreCase))
                        {
                            demoArg = cmdArgs[i].Substring("--demo=".Length).Trim('\"');
                        }
                        else if (cmdArgs[i].Equals("--demo-drawer", StringComparison.OrdinalIgnoreCase))
                        {
                            showDrawer = true;
                        }
                    }

                    if (!string.IsNullOrEmpty(screenshotArg))
                    {
                        try
                        {
                            await Task.Delay(500);
                            if (!string.IsNullOrEmpty(demoArg))
                            {
                                await _webView.CoreWebView2.ExecuteScriptAsync(
                                    "(() => {" +
                                    "  const btn = document.getElementById('menuLoad" + demoArg + "');" +
                                    "  if (btn) btn.click();" +
                                    "})();"
                                );
                                await Task.Delay(800);
                            }

                            if (showDrawer)
                            {
                                await _webView.CoreWebView2.ExecuteScriptAsync(
                                    "(() => {" +
                                    "  const railBtn = document.getElementById('railPhotoDemoBtn');" +
                                    "  if (railBtn) railBtn.click();" +
                                    "})();"
                                );
                                await Task.Delay(400);
                            }

                            string fullScreenshotPath = Path.GetFullPath(screenshotArg);
                            string screenshotDir = Path.GetDirectoryName(fullScreenshotPath);
                            if (!string.IsNullOrEmpty(screenshotDir)) Directory.CreateDirectory(screenshotDir);

                            using (FileStream fs = new FileStream(fullScreenshotPath, FileMode.Create, FileAccess.Write))
                            {
                                await _webView.CoreWebView2.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, fs);
                            }
                        }
                        catch (Exception scEx)
                        {
                            try { File.AppendAllText(Path.Combine(Program.AppRuntimeDir, "startup.log"), "ScreenshotError: " + scEx + "\r\n"); } catch { }
                        }
                        finally
                        {
                            Application.Exit();
                        }
                    }
                };
                _webView.CoreWebView2.Navigate(url);
            }
            catch (Exception ex)
            {
                try { File.AppendAllText(Path.Combine(Program.AppRuntimeDir, "startup.log"), "InitError: " + ex + "\r\n"); } catch { }

                // Native in-window error banner - NEVER open external web browser!
                Label errLbl = new Label
                {
                    Dock = DockStyle.Fill,
                    TextAlign = ContentAlignment.MiddleCenter,
                    ForeColor = Color.FromArgb(235, 90, 90),
                    BackColor = Color.FromArgb(11, 11, 13),
                    Font = new Font("Segoe UI", 11.5f),
                    Text = "AsciiYart Desktop Window: Error initializing engine.\n\n" + ex.Message
                };
                Controls.Clear();
                Controls.Add(errLbl);
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            try { _server.Dispose(); } catch { }
            try
            {
                if (!string.IsNullOrEmpty(_activeUserDataDir) && Directory.Exists(_activeUserDataDir))
                {
                    ThreadPool.QueueUserWorkItem(_ =>
                    {
                        try { Directory.Delete(_activeUserDataDir, true); } catch { }
                    });
                }
            }
            catch { }
            base.OnFormClosed(e);
        }
    }
}
