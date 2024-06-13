import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { Platform } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const App = () => {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valor, setValor] = useState("");
  const [total, setTotal] = useState(0);
  const [editandoProdutoId, setEditandoProdutoId] = useState(null);

  const adicionarProduto = () => {
    const quantidadeNum = parseFloat(quantidade);
    const valorNum = parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.'));

    if (!nome || isNaN(quantidadeNum) || isNaN(valorNum)) {
      alert("Por favor, preencha todos os campos corretamente.");
      return;
    }

    const novoProduto = {
      id: editandoProdutoId ? editandoProdutoId : Math.random().toString(),
      nome,
      quantidade: quantidadeNum,
      valor: valorNum,
    };

    if (editandoProdutoId) {
      const produtosAtualizados = produtos.map((produto) =>
        produto.id === editandoProdutoId ? novoProduto : produto
      );
      setProdutos(produtosAtualizados);
      const produtoAnterior = produtos.find(
        (produto) => produto.id === editandoProdutoId
      );
      setTotal(
        total -
        (produtoAnterior?.quantidade ?? 0) * (produtoAnterior?.valor ?? 0) +
        quantidadeNum * valorNum
      );
      setEditandoProdutoId(null);
    } else {
      setProdutos([...produtos, novoProduto]);
      setTotal(total + novoProduto.quantidade * novoProduto.valor);
    }

    setNome("");
    setQuantidade("");
    setValor("");
    Keyboard.dismiss();
  };

  const editarProduto = (produto) => {
    setNome(produto.nome);
    setQuantidade(produto.quantidade.toString());
    setValor(produto.valor.toFixed(2).replace(".", ","));
    setEditandoProdutoId(produto.id);
  };

  const excluirProduto = (id) => {
    const produtoExcluido = produtos.find((produto) => produto.id === id);
    setProdutos(produtos.filter((produto) => produto.id !== id));
    setTotal(
      total - (produtoExcluido?.quantidade ?? 0) * (produtoExcluido?.valor ?? 0)
    );
  };

  const formatarValor = (valor) => {
    return parseFloat(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const exportarParaExcel = async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(produtos);

    XLSX.utils.book_append_sheet(wb, ws, "Produtos");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    let uri;

    if (Platform.OS === "web") {
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      window.open(url); 
      return; 
    } else {
      uri = FileSystem.cacheDirectory + "produtos.xlsx";

      try {
        await FileSystem.writeAsStringAsync(uri, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (error) {
        console.error("Erro ao escrever arquivo:", error);
        return;
      }
    }

    try {
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Erro ao compartilhar arquivo:", error);
    }
  };



  const renderProduto = ({ item }) => (
    <View style={styles.produto}>
      <Text>{item.nome}</Text>
      <Text>
        {item.quantidade} x {formatarValor(item.valor)}
      </Text>
      <View style={styles.botoes}>
        <TouchableOpacity
          onPress={() => editarProduto(item)}
          style={styles.botao}
        >
          <Icon name="edit" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => excluirProduto(item.id)}
          style={styles.botao}
        >
          <Icon name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Lista de Compras</Text>
      <TextInput
        placeholder="Nome do produto"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />
      <TextInput
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholder="Valor"
        value={valor}
        onChangeText={(texto) => setValor(texto.replace(/[^\d.,]/g, '').replace(',', '.'))}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button
        title={editandoProdutoId ? "Salvar Alterações" : "Adicionar Produto"}
        onPress={adicionarProduto}
      />
      <FlatList
        data={produtos}
        renderItem={renderProduto}
        keyExtractor={(item) => item.id}
        style={styles.lista}
      />
      <Text style={styles.total}>Total: {formatarValor(total)}</Text>
      <Button title="Exportar para Excel" onPress={exportarParaExcel} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  lista: {
    marginTop: 20,
  },
  produto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  botoes: {
    flexDirection: "row",
    alignItems: "center",
  },
  botao: {
    marginLeft: 10,
    backgroundColor: "#007BFF",
    padding: 5,
    borderRadius: 5,
  },
  botaoTexto: {
    color: "#fff",
  },
  total: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
  },
});

export default App;
