Add-Type -AssemblyName System.Drawing

$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = 'AntiAlias'
$g.TextRenderingHint = 'ClearTypeGridFit'

# Base
$bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(26,31,38))
$g.FillRectangle($bg, 0, 0, $W, $H)

# Grid lines
$grid = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(20,88,166,255)), 1
for ($x = 0; $x -lt $W; $x += 58) { $g.DrawLine($grid, $x, 0, $x, $H) }
for ($y = 0; $y -lt $H; $y += 58) { $g.DrawLine($grid, 0, $y, $W, $y) }

# Corner glow
$glowRect = New-Object System.Drawing.Rectangle(760, -260, 700, 700)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse($glowRect)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush($path)
$glow.CenterColor = [System.Drawing.Color]::FromArgb(110,88,166,255)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0,26,31,38))
$g.FillEllipse($glow, $glowRect)

$PAD = 84

# Accent rule
$accent = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point($PAD,0)),
  (New-Object System.Drawing.Point(($PAD+300),0)),
  [System.Drawing.Color]::FromArgb(255,88,166,255),
  [System.Drawing.Color]::FromArgb(255,86,211,100))
$g.FillRectangle($accent, $PAD, 118, 92, 4)

# Eyebrow
$mono = New-Object System.Drawing.Font('Consolas', 17, [System.Drawing.FontStyle]::Regular)
$blueB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(88,166,255))
$g.DrawString('LAGOS, NIGERIA  //  AVAILABLE FOR WORK', $mono, $blueB, ($PAD + 112), 108)

# Name
$serif = New-Object System.Drawing.Font('Georgia', 76, [System.Drawing.FontStyle]::Regular)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(214,224,234))
$g.DrawString('Godfrey', $serif, $white, ($PAD - 8), 168)

$serifI = New-Object System.Drawing.Font('Georgia', 76, [System.Drawing.FontStyle]::Italic)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point($PAD,0)),
  (New-Object System.Drawing.Point(($PAD+560),0)),
  [System.Drawing.Color]::FromArgb(255,88,166,255),
  [System.Drawing.Color]::FromArgb(255,86,211,100))
$g.DrawString('Ajeyemi', $serifI, $grad, ($PAD - 8), 278)

# Role
$mono2 = New-Object System.Drawing.Font('Consolas', 23, [System.Drawing.FontStyle]::Regular)
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(147,161,174))
$g.DrawString('> Full-Stack Developer & IT Specialist', $mono2, $muted, ($PAD - 4), 404)

# Stack chips
$chipFont = New-Object System.Drawing.Font('Consolas', 15, [System.Drawing.FontStyle]::Regular)
$chips = @('Django', 'Python', 'React', 'PostgreSQL', 'AI Integration')
$cx = $PAD
$cy = 476
foreach ($c in $chips) {
  $sz = $g.MeasureString($c, $chipFont)
  # NB: must not be named $w — PowerShell vars are case-insensitive and it
  # would clobber the canvas width $W.
  $chipW = [int]$sz.Width + 34
  $r  = New-Object System.Drawing.Rectangle($cx, $cy, $chipW, 42)
  $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(30,88,166,255))
  $pen  = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(80,88,166,255)), 1
  $g.FillRectangle($fill, $r)
  $g.DrawRectangle($pen, $r)
  $g.DrawString($c, $chipFont, $blueB, ($cx + 16), ($cy + 10))
  $cx += $chipW + 12
}

# Footer rule + handles. Right side uses a layout rect with Far alignment
# rather than MeasureString arithmetic, which mis-measured under font fallback.
$rule = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(34,255,255,255))
$g.FillRectangle($rule, $PAD, 552, ($W - 2 * $PAD), 1)

$g.DrawString('godfreyportfolio.netlify.app', $mono, $blueB, ($PAD - 4), 574)

$far = New-Object System.Drawing.StringFormat
$far.Alignment = [System.Drawing.StringAlignment]::Far
$farRect = New-Object System.Drawing.RectangleF($PAD, 574, ($W - 2 * $PAD), 40)
$g.DrawString('github.com/Godfreyoz', $mono, $muted, $farRect, $far)

$out = 'c:\Users\g_ajeyemi\Desktop\project\portfolio\assets\og-image.png'
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "Wrote $out"
