#!/usr/bin/perl
use strict;
use warnings;

local $/;
my $content = <>;

# Remover bloques "Setup pnpm" completos
$content =~ s/^(\s*-\s*name:\s*Setup\s*pnpm.*?\n(?:(?!\s*-\s*name:).*\n)*)//gm;

# Para cada bloque "Setup Node", quitar cache y asegurar node-version
while ($content =~ /(^(\s*)-\s*name:\s*Setup\s*Node.*?\n)((?:(?!\2-\s*name:).*\n)*)/gm) {
    my ($header, $indent, $body) = ($1, $2, $3);
    
    # Quitar líneas de cache
    $body =~ s/^.*cache.*\n//gm;
    
    # Si no tiene with:, agregarlo
    if ($body !~ /with:/) {
        $body .= "${indent}with:\n${indent}  node-version: \"20\"\n";
    } else {
        # Si tiene with: pero no node-version, agregarlo
        if ($body !~ /node-version:/) {
            $body =~ s/(${indent}with:\s*\n)/$1${indent}  node-version: "20"\n/;
        } else {
            # Si tiene node-version, actualizarlo
            $body =~ s/^(\s*)node-version:.*/$1node-version: "20"/gm;
        }
    }
    
    my $replacement = $header . $body;
    $content =~ s/\Q$header$3\E/$replacement/;
}

print $content;
