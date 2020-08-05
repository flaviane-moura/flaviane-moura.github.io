var arrayItensNames = [];
var exportString = '';

function runTopSis() {
    
    var varAuxIt = $("#info-it input:last").attr('id');
    var itens = parseInt(varAuxIt.split('m')[1]);

    var varAuxCr = $("#info-cri input:last").attr('id');
    var criterios = parseInt(varAuxCr.split('t')[1]);
    var pesos = [];
    var importancias = [];

    for (index = 0; index < $("#info-pcri input").length; index++) {
        pesos[index] = (parseFloat($("#pcrit" + index).val())) / 10;

        //se max entao 1 , min entao 0
        if ($("#pimportancia" + index).val() == 'min') {
            importancias[index] = 0;
        } else {
            importancias[index] = 1;
        }
    }

    var linha = new Object();

    //pegando escopo dos pesos
    exportString = "<meta charset='UTF-8'><table border='1' ><tr><td>Pesos</td>";
    for (i = 0; i <= criterios; i++) {
        exportString = exportString + '<td>' + $("#pcrit" + i).val() + '</td>';
    }
    exportString = exportString + '</tr><tr><td>Importancia</td>';

    //pegando escopo das importancias
    for (i = 0; i <= criterios; i++) {
        var aux = $("#pimportancia" + i).val();
        if (aux.length < 1) {
            exportString = exportString + '<td>max</td>';
        } else {
            exportString = exportString + '<td>min</td>';
        }
    }
    exportString = exportString + '</tr><tr><td>Itens/Criterios</td>';

    //pegando escopo dos criterios
    for (i = 0; i <= criterios; i++) {
        exportString = exportString + '<td>' + this.removerAcentos($("#crit" + i).val()) + '</td>';
    }
    exportString = exportString + '</tr>';

    for ( i = 0; i <= itens; i++) {
        exportString = exportString + '<tr><td>' + this.removerAcentos($("#itm" + i).val()) + '</td>';
        for ( j = 0; j <= criterios; j++) {
            exportString = exportString + '<td>'+ $("#matriz" + i + "-" + j).val() +'</td>';            
        }
        exportString = exportString + '</tr>';
    }
    
    exportString = exportString + '</table>';

    exporta();
 
    //pegando escopo dos criterios
    for (i = 0; i <= itens; i++) {
        //atribuindo novo vetor para ordenaÃ§Ã£o
        var itemName = [];
        itemName['name'] = '';
        itemName['name'] = $("#itm" + i).val();
        arrayItensNames[i] = itemName;

        var coluna = new Object();
        for (j = 0; j <= criterios; j++) {
            var valorCelula = $("#matriz" + i + "-" + j).val();
            coluna["" + j + ""] = valorCelula;
        }
        linha["" + i + ""] = coluna;
    }

    step1 = passo1(linha, itens, criterios);
    step2 = passo2(step1, pesos, itens, criterios)
    step3 = passo3(step2, importancias, itens, criterios);
    step4 = passo4(step2, step3, itens, criterios);
    step5 = passo5(step4, itens);

    $(".mascara").show();
    $(".window").show();
    $("#btn-execute").hide();
    $("#btn-export").show();

    var retornoHtml = '<a onclick="fechaModal();" id="fechaModal">Fechar X </a><br><div id="title">Rankeamento</div><br>'; var i = 1;
    var contador=0;
    var numcolunas=90;
    step5.forEach(element => {
        retornoHtml = retornoHtml + i + 'º - Item: ' + element['name'] + ' - Classificacao: ' + element['value'] + '<br>';
        i++;
        contador++;
    });
    retornoHtml += "<br><textarea rows="+ contador +" cols =" +numcolunas+" placeholder= 'Análises alternativas' </textarea>"

    $("#resultadoTopSis").html(retornoHtml);
}

//normalizar a matriz
function passo1(matrizEntrada, numAlternativas, numAtributos) {
    var matrizAux = [];
    var matrizSaida = [];
    var vetorSomatorioColunas = [4];
    var vetorSomatorioRaiz;
    vetorSomatorioRaiz = [4];

    //eleva todos os elementos da matriz ao quadrado
    for (i = 0; i <= numAlternativas; i++) {
        var coluna = new Object();
        for (j = 0; j <= numAtributos; j++) {
            coluna[j] = Math.pow(matrizEntrada[i][j], 2);
        }
        matrizAux[i] = coluna;
    }

    //realiza somatorio das colunas e eleva a 0,5
    for (z = 0; z <= numAtributos; z++) {
        var soma = 0;
        for (i = 0; i <= numAlternativas; i++) {
            soma = matrizAux[i][z] + soma;
        }
        vetorSomatorioColunas[z] = Math.pow(soma, 0.5).toFixed(2);
    }

    //dividir cada elemento da matriz pelos resultados do vetor de somas
    for (i = 0; i <= numAlternativas; i++) {
        var coluna = new Object();
        for (j = 0; j <= numAtributos; j++) {
            //olhar essa parte do arredondamento
            coluna[j] = (matrizEntrada[i][j] / vetorSomatorioColunas[j]).toFixed(2);
        }
        matrizSaida[i] = coluna;
    }

    return matrizSaida;
}

//matriz normalizada ponderada
function passo2(matrizEntrada, pesos, numAlternativas, numAtributos) {
    var matrizSaida = [];

    //multiplica cada item pelo seu respectivo peso
    for (i = 0; i <= numAlternativas; i++) {
        var coluna = new Object();
        for (j = 0; j <= numAtributos; j++) {
            coluna[j] = (matrizEntrada[i][j] * pesos[j]).toFixed(3);
        }
        matrizSaida[i] = coluna;
    }

    return matrizSaida;
}

//calculando solucoes ideais
function passo3(matrizEntrada, vetorImportancias, numAlternativas, numAtributos) {
    var ideal = [];
    var idealNegativa = [];
    var matrizSaida = [];
    var valorComparacaoIdeal = [];
    var valorComparacaoNegativa = [];
    var retornoSolucoes = [];
    var pivo;

    for (z = 0; z <= numAtributos; z++) {
        for (i = 0; i <= numAlternativas; i++) {
            for (j = 0; j <= numAtributos; j++) {

                //pegar o primeiro elemento pra ser usado como parametro
                if (i === 0) { pivo = matrizEntrada[i][z] }

                // 1 maior melhor --- 0 menor melhor
                if (vetorImportancias[z] === 1) {
                    pivo = pivo < matrizEntrada[i][z] ? pivo = matrizEntrada[i][z] : pivo
                }
                else {
                    pivo = pivo > matrizEntrada[i][z] ? pivo = matrizEntrada[i][z] : pivo
                }
            }
        }
        valorComparacaoIdeal[z] = pivo;
    }
    retornoSolucoes[0] = valorComparacaoIdeal;


    for (z = 0; z <= numAtributos; z++) {
        for (i = 0; i <= numAlternativas; i++) {
            for (j = 0; j <= numAtributos; j++) {

                //pegar o primeiro elemento pra ser usado como parametro
                if (i === 0) { pivo = matrizEntrada[i][z] }

                // 1 maior melhor --- 0 menor melhor
                if (vetorImportancias[z] === 1) {
                    pivo = pivo > matrizEntrada[i][z] ? pivo = matrizEntrada[i][z] : pivo
                }
                else {
                    pivo = pivo < matrizEntrada[i][z] ? pivo = matrizEntrada[i][z] : pivo
                }
            }
        }
        valorComparacaoNegativa[z] = pivo;
    }
    retornoSolucoes[1] = valorComparacaoNegativa;

    return retornoSolucoes;


    // for (i = 0; i < numAlternativas; i++) {
    //     for (j = 0; j < numAtributos; j++) {
    //         //se quanto maior melhor

    //         if (vetorImportancias[j] === 1) {
    //             if (valorComparacaoNegativa[j] < matrizAux[i][j]) {
    //                 valorComparacaoNegativa[j] = matrizAux[i][j];
    //             }
    //         }
    //         //se quanto menor melhor
    //         else {
    //             if (valorComparacaoNegativa[j] > matrizAux[i][j]) {
    //                 valorComparacaoNegativa[j] = matrizAux[i][j];
    //             }
    //         }
    //         idealNegativa[j] = valorComparacaoNegativa[j];
    //     }
    // }
    // retornoSolucoes[1] = idealNegativa;
    // return retornoSolucoes;
}

//calculando medida de separacao
function passo4(matrizEntrada, retornoSolucoes, numAlternativas, numAtributos) {
    var ideal = retornoSolucoes[0];
    var idealNegativa = retornoSolucoes[1];
    var matrizSaida = [];
    var retorno = [];
    var medidaSeparacaoIdeal = [];
    var medidaSeparacaoIdealNegativa = [];

    // $retornoMedidas = array();

    //para a medida ideal
    for (i = 0; i <= numAlternativas; i++) {
        var somatorioMedSepIdeal = 0;
        for (j = 0; j <= numAtributos; j++) {
            somatorioMedSepIdeal = somatorioMedSepIdeal + Math.pow((matrizEntrada[i][j] - ideal[j]), 2);
        }
        medidaSeparacaoIdeal[i] = (Math.pow(somatorioMedSepIdeal, 0.5)).toFixed(3);
    }
    retorno[0] = medidaSeparacaoIdeal;

    //para a medida ideal negativa
    for (i = 0; i <= numAlternativas; i++) {
        var somatorioMedSepIdealNegativa = 0;
        for (j = 0; j <= numAtributos; j++) {
            somatorioMedSepIdealNegativa = somatorioMedSepIdealNegativa + Math.pow((matrizEntrada[i][j] - idealNegativa[j]), 2);
        }
        medidaSeparacaoIdealNegativa[i] = (Math.pow(somatorioMedSepIdealNegativa, 0.5)).toFixed(3);
    }
    retorno[1] = medidaSeparacaoIdealNegativa;

    return retorno;
}

function passo5(retornoMedidas, numAlternativas) {
    var ideal = retornoMedidas[0];
    var idealNegativa = retornoMedidas[1];

    var resultadoFinal = [];
    var retorno = [];
    var indice = 0;

    //para calcular os valores finais
    for (i = 0; i <= numAlternativas; i++) {
        var soma = parseFloat(ideal[i]) + parseFloat(idealNegativa[i]);
        resultadoFinal[i] = parseFloat(idealNegativa[i]) / soma;
    }

    //preenche o vetor de nome, com os valores finais obtidos de cada item
    for (i = 0; i <= numAlternativas; i++) {
        arrayItensNames[i]['value'] = resultadoFinal[i];
    }

    arrayItensNames.sort(sortFunction);

    // var pivo = resultadoFinal[0];
    // //escolhhendo melhor valor final
    // for (i = 0; i <= numAlternativas; i++) {
    //     if (pivo < resultadoFinal[i]) {
    //         indice = i;
    //         pivo = resultadoFinal[i];
    //     }
    // }
    // retorno[0] = indice;
    // retorno[1] = pivo;

    // return retorno;
    return arrayItensNames;
}

function sortFunction(a, b) {
    if (a['value'] === b['value']) {
        return 0;
    }
    else {
        return (a['value'] > b['value']) ? -1 : 1;
    }
}

function exporta() {
    $.ajax({
        url: 'ajax.php',
        type: 'POST',
        data: { "string": exportString },
        success: function (retorno) {
            try {
                // meusPedidos = jQuery.parseJSON(retorno);
                // alert('deu certo');
            } catch (e) {
                // modal('Erro', r, "PROSSEGUIR");
                alert('deu errado');
            }
        },
        error: function (a, b, c) {
            modal('Erro', 'Verifique sua conexÃ£o.', "PROSSEGUIR");
        }
    });
}

function fechaModal(){
    $(".mascara").hide();
    $(".window").hide();
}

function removerAcentos( newStringComAcento ) {
    var string = newStringComAcento;
    var mapaAcentosHex = {
        a : /[\xE0-\xE6]/g,
        A : /[\xC0-\xC6]/g,
        e : /[\xE8-\xEB]/g,
        E : /[\xC8-\xCB]/g,
        i : /[\xEC-\xEF]/g,
        I : /[\xCC-\xCF]/g,
        o : /[\xF2-\xF6]/g,
        O : /[\xD2-\xD6]/g,
        u : /[\xF9-\xFC]/g,
        U : /[\xD9-\xDC]/g,
        c : /\xE7/g,
        C : /\xC7/g,
        n : /\xF1/g,
        N : /\xD1/g,
        };
  
      for ( var letra in mapaAcentosHex ) {
          var expressaoRegular = mapaAcentosHex[letra];
          string = string.replace( expressaoRegular, letra );
      }
  
      return string;
  }

