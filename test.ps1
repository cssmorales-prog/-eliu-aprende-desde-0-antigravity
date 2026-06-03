$html = @"
<html><head><meta http-equiv='x-ua-compatible' content='ie=edge'>
<script>
window.onerror=function(m,u,l){
    try {
        var f=new ActiveXObject('Scripting.FileSystemObject');
        var t=f.CreateTextFile('error.txt',true);
        t.WriteLine(m+' at line '+l);
        t.Close();
    } catch(e) {}
};
</script>
<script src='js/app.js'></script>
</head><body></body></html>
"@
Set-Content test.html $html
$ie = New-Object -ComObject InternetExplorer.Application
$ie.Visible = $false
$ie.Navigate("file:///" + (Get-Location).Path.Replace('\','/') + "/test.html")
Start-Sleep -Seconds 3
if (Test-Path error.txt) {
    Get-Content error.txt
} else {
    Write-Host "No error or ActiveX blocked"
}
$ie.Quit()
